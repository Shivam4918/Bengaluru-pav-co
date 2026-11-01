import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpayVerifySchema } from "@/lib/validations";
import { razorpayService } from "@/lib/razorpay";
import { processOrderRecipeBOM } from "@/lib/bom-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = razorpayVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment verification payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    // Fetch matching order
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 1. Cryptographic HMAC SHA-256 signature verification
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      // Record failed transaction attempt
      await prisma.transaction.create({
        data: {
          orderId: order.id,
          paymentGatewayRef: razorpay_payment_id,
          orderGatewayRef: razorpay_order_id,
          signature: razorpay_signature,
          amount: order.totalAmount,
          status: "FAILED",
          gatewayPayloadJson: JSON.stringify({ reason: "Cryptographic HMAC SHA256 Signature Mismatch" }),
        },
      });

      return NextResponse.json(
        { error: "Payment verification failed: Invalid cryptographic signature!" },
        { status: 400 }
      );
    }

    // 2. Mark order as PAID and CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
      include: {
        items: true,
      },
    });

    // 3. Record Successful Transaction in Relational Ledger
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        paymentGatewayRef: razorpay_payment_id,
        orderGatewayRef: razorpay_order_id,
        signature: razorpay_signature,
        amount: order.totalAmount,
        status: "SUCCESS",
        gatewayPayloadJson: JSON.stringify(body),
      },
    });

    // 4. Trigger Recipe BOM deduction
    try {
      await processOrderRecipeBOM(order.id);
    } catch (bomErr) {
      console.error("Recipe BOM deduction non-fatal notice:", bomErr);
    }

    // 5. Audit Log
    await prisma.auditLog.create({
      data: {
        action: "PAYMENT_VERIFIED",
        entityType: "ORDER",
        entityId: order.id,
        detailsJson: JSON.stringify({
          paymentGatewayRef: razorpay_payment_id,
          amount: order.totalAmount,
          method: "RAZORPAY",
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and order confirmed!",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
