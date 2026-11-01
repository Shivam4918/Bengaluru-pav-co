import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";

// Helper: Require Admin
async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

/**
 * GET /api/admin/customers
 * Returns all registered customers with lifetime spend and order metrics
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        addresses: {
          select: {
            addressLine: true,
            pincode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = customers.map((c) => {
      const paidOrders = c.orders.filter((o) => o.paymentStatus === "PAID");
      const lifetimeSpend = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || "—",
        loyaltyPoints: c.loyaltyPoints,
        totalOrders: c.orders.length,
        lifetimeSpend: Number(lifetimeSpend.toFixed(2)),
        lastOrderDate: c.orders[0]?.createdAt || null,
        joinedDate: c.createdAt,
        addressesCount: c.addresses.length,
      };
    });

    return NextResponse.json({ customers: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load customers" }, { status: 500 });
  }
}

