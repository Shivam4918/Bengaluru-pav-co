import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activeOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP"],
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const readyTokens = await prisma.order.findMany({
      where: {
        status: "READY_FOR_PICKUP",
      },
      select: {
        tokenNo: true,
        orderNumber: true,
        orderType: true,
        readyAt: true,
      },
      orderBy: {
        readyAt: "desc",
      },
      take: 10,
    });

    const store = await prisma.storeSetting.findUnique({
      where: { id: "primary" },
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      activeOrders,
      readyTokens,
      store,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
