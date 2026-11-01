import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const storeSetting = await prisma.storeSetting.findUnique({
      where: { id: "primary" },
    });

    // Compute live operational metrics
    const activeOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP"],
        },
      },
      include: {
        items: true,
      },
    });

    const allOrders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
      },
      select: {
        totalAmount: true,
        gstAmount: true,
        createdAt: true,
        status: true,
      },
    });

    const grossRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalGST = allOrders.reduce((sum, o) => sum + o.gstAmount, 0);
    const paidCount = allOrders.length;
    const aov = paidCount > 0 ? grossRevenue / paidCount : 0;

    return NextResponse.json({
      store: storeSetting,
      activeQueueCount: activeOrders.length,
      metrics: {
        grossRevenue: Number(grossRevenue.toFixed(2)),
        totalGST: Number(totalGST.toFixed(2)),
        paidOrdersCount: paidCount,
        averageOrderValue: Number(aov.toFixed(2)),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const updated = await prisma.storeSetting.upsert({
      where: { id: "primary" },
      update: {
        isStoreOpen: body.isStoreOpen !== undefined ? body.isStoreOpen : undefined,
        surgeThrottleActive: body.surgeThrottleActive !== undefined ? body.surgeThrottleActive : undefined,
        avgPrepTimeMin: body.avgPrepTimeMin !== undefined ? body.avgPrepTimeMin : undefined,
        bannerNotice: body.bannerNotice !== undefined ? body.bannerNotice : undefined,
      },
      create: {
        id: "primary",
        storeName: "Mumbai Pav Co. (Bengaluru Koramangala Hub)",
        isStoreOpen: body.isStoreOpen ?? true,
        surgeThrottleActive: body.surgeThrottleActive ?? false,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "STORE_CONFIG_CHANGED",
        entityType: "STORE",
        entityId: "primary",
        actorRole: "ADMIN",
        detailsJson: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      success: true,
      store: updated,
      message: "Store settings updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
