import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { updateProfileSchema, sanitizeInput, normalizeIndianPhone } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        addresses: true,
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        addresses: user.addresses,
        recentOrders: user.orders,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, phone, addressLine, pincode, landmark } = parsed.data;

    // Check duplicate phone if phone is updated
    if (phone) {
      const normalizedPhone = normalizeIndianPhone(phone);
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: normalizedPhone,
          id: { not: payload.userId },
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "This mobile number is already linked to another account." },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = sanitizeInput(name);
    if (phone !== undefined) updateData.phone = phone ? normalizeIndianPhone(phone) : null;

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      include: {
        addresses: true,
      },
    });

    // If address was provided, save or update the default address
    if (addressLine && pincode) {
      const existingAddress = await prisma.address.findFirst({
        where: { userId: payload.userId, isDefault: true },
      });

      if (existingAddress) {
        await prisma.address.update({
          where: { id: existingAddress.id },
          data: {
            addressLine: sanitizeInput(addressLine),
            pincode: pincode.trim(),
            landmark: landmark ? sanitizeInput(landmark) : null,
          },
        });
      } else {
        await prisma.address.create({
          data: {
            userId: payload.userId,
            addressLine: sanitizeInput(addressLine),
            pincode: pincode.trim(),
            landmark: landmark ? sanitizeInput(landmark) : null,
            isDefault: true,
          },
        });
      }
    }

    // Refresh addresses
    const allAddresses = await prisma.address.findMany({
      where: { userId: payload.userId },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        loyaltyPoints: updatedUser.loyaltyPoints,
        addresses: allAddresses,
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
