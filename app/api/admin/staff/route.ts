import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { createStaffSchema, updateStaffSchema, sanitizeInput } from "@/lib/validations";

export const dynamic = "force-dynamic";

// Helper: Require Admin Authorization
async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

/**
 * GET /api/admin/staff
 * Lists all internal store staff and admin users
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const staffList = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "KITCHEN_STAFF", "CASHIER"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ staff: staffList, currentAdminId: admin.userId });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to load staff list" }, { status: 500 });
  }
}

/**
 * POST /api/admin/staff
 * Adds a new Kitchen Chef or Cashier to the store
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: `An account with email ${normalizedEmail} already exists.` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
      data: {
        name: sanitizeInput(name),
        email: normalizedEmail,
        passwordHash,
        role,
        loyaltyPoints: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error: any) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: "Failed to create staff account" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/staff
 * Updates staff member details or resets password
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { id, name, role, password } = parsed.data;

    const updateData: any = {};
    if (name) updateData.name = sanitizeInput(name);
    if (role) updateData.role = role;
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (error: any) {
    console.error("Update staff error:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/staff
 * Deletes a staff member (revokes access immediately)
 */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Staff user ID is required." }, { status: 400 });
    }

    // Safety: Admin cannot delete their own active account
    if (id === admin.userId) {
      return NextResponse.json(
        { error: "Security restriction: You cannot delete your own master admin account." },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Staff account deleted successfully." });
  } catch (error: any) {
    console.error("Delete staff error:", error);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}
