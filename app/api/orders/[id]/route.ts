import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderStatusTransitionSchema } from "@/lib/validations";
import { processOrderRecipeBOM } from "@/lib/bom-engine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        transactions: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const parsed = orderStatusTransitionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status transition payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, actorRole, actorName, reason } = parsed.data;

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [{ id: id }, { orderNumber: id }],
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: any = {
      status,
    };

    const now = new Date();

    if (status === "PREPARING" && !existingOrder.prepStartedAt) {
      updateData.prepStartedAt = now;
      // Deduct Recipe BOM if not already deducted
      try {
        await processOrderRecipeBOM(existingOrder.id);
      } catch (err) {
        console.warn("BOM deduction non-fatal notice:", err);
      }
    } else if (status === "READY_FOR_PICKUP") {
      updateData.readyAt = now;
    } else if (status === "COMPLETED") {
      updateData.completedAt = now;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: updateData,
      include: {
        items: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        action: "STATUS_TRANSITION",
        entityType: "ORDER",
        entityId: existingOrder.id,
        actorRole,
        detailsJson: JSON.stringify({
          previousStatus: existingOrder.status,
          newStatus: status,
          actorName,
          reason: reason || null,
          timestamp: now.toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order #${updatedOrder.tokenNo} updated to ${status}`,
    });
  } catch (error: any) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
