import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema, sanitizeInput, normalizeIndianPhone } from "@/lib/validations";
import { validateBengaluruPincode } from "@/lib/bengaluru-zones";
import { evaluateCoupon } from "@/lib/coupons";
import { razorpayService } from "@/lib/razorpay";
import { processOrderRecipeBOM } from "@/lib/bom-engine";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 0. IP Rate Limiting (max 15 orders per IP per 5 minutes to prevent spam bots)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`order:${clientIp}`, 15, 300);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many order requests. Please wait ${rateCheck.resetInSeconds} seconds before trying again.` },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 1. Zod input validation
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        {
          error: firstError,
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 2. Idempotency Check (prevent double submit / network re-tries)
    if (data.idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: { items: true },
      });
      if (existing) {
        return NextResponse.json({
          message: "Order already placed (Idempotent response)",
          order: existing,
          isDuplicate: true,
        });
      }
    }

    // 3. Store Open & Surge Throttle Check
    const storeSetting = await prisma.storeSetting.findUnique({
      where: { id: "primary" },
    });

    if (storeSetting && !storeSetting.isStoreOpen) {
      return NextResponse.json(
        { error: "Mumbai Pav Co. is currently closed. Kitchen opens tomorrow at 11:00 AM." },
        { status: 403 }
      );
    }

    // 4. Delivery Pincode & Geofence Check
    let deliveryFee = 0;
    if (data.orderType === "DELIVERY") {
      const zoneCheck = validateBengaluruPincode(data.deliveryPincode || "");
      if (!zoneCheck.isServiceable) {
        return NextResponse.json(
          { error: zoneCheck.message, zoneCheck },
          { status: 400 }
        );
      }
      deliveryFee = zoneCheck.deliveryFee;
    }

    // 5. Calculate Subtotal from Database Prices (Never trust client prices!)
    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      menuItemId: string;
      itemTitle: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      selectedModifiersJson: string;
    }> = [];

    const clientSlugMap: Record<string, string> = {
      "classic-1": "classic-mumbai-vada-pav",
      "cheese-1": "cheese-burst-vada-pav",
      "ulta-1": "ulta-vada-pav",
      "kolhapuri-1": "kolhapuri-thecha-vada-pav",
      "combo-1": "mumbai-express-combo",
      "chai-1": "kadak-mumbai-cutting-chai",
      "lassi-1": "ratnagiri-mango-lassi",
      "mirchi-1": "salted-fried-mirchi-fry",
    };

    for (const itemInput of data.items) {
      const mappedSlug = clientSlugMap[itemInput.menuItemId] || itemInput.menuItemId;

      const menuItem = await prisma.menuItem.findFirst({
        where: {
          OR: [
            { id: itemInput.menuItemId },
            { slug: mappedSlug },
            { slug: itemInput.menuItemId },
            { title: itemInput.itemTitle },
          ],
        },
      });

      if (!menuItem || !menuItem.isAvailable) {
        return NextResponse.json(
          { error: `Item "${itemInput.itemTitle}" is currently sold out or unavailable.` },
          { status: 400 }
        );
      }

      // Calculate modifier extra cost
      let modifiersCost = 0;
      if (itemInput.selectedModifiers && itemInput.selectedModifiers.length > 0) {
        modifiersCost = itemInput.selectedModifiers.reduce(
          (sum, mod) => sum + (mod.extraPrice || 0),
          0
        );
      }

      const itemUnitPrice = menuItem.price + modifiersCost;
      const itemTotal = itemUnitPrice * itemInput.quantity;
      calculatedSubtotal += itemTotal;

      validatedItems.push({
        menuItemId: menuItem.id,
        itemTitle: menuItem.title,
        unitPrice: itemUnitPrice,
        quantity: itemInput.quantity,
        totalPrice: itemTotal,
        selectedModifiersJson: JSON.stringify(itemInput.selectedModifiers || []),
      });
    }

    // 6. Coupon & Loyalty Discount Calculation
    let couponDiscount = 0;
    if (data.couponCode) {
      const couponEval = evaluateCoupon(
        data.couponCode,
        calculatedSubtotal,
        data.items.map((i) => ({
          cartItemId: i.menuItemId,
          menuItemId: i.menuItemId,
          title: i.itemTitle,
          price: i.unitPrice,
          quantity: i.quantity,
          spiceLevel: i.spiceLevel,
          selectedModifiers: i.selectedModifiers,
        }))
      );
      if (couponEval.isValid) {
        couponDiscount = couponEval.discountAmount;
      }
    }

    // Authenticated user resolution
    const authToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    let authUserId: string | null = null;
    let authUserRecord: any = null;
    if (authToken) {
      const payload = await verifyAuthToken(authToken);
      if (payload?.userId) {
        authUserId = payload.userId;
        authUserRecord = await prisma.user.findUnique({ where: { id: payload.userId } });
      }
    }

    // Loyalty points redemption: 50 points = ₹25.00 discount
    let loyaltyDiscount = 0;
    let pointsRedeemed = 0;
    if (data.redeemLoyaltyPoints && authUserRecord && authUserRecord.loyaltyPoints >= 50) {
      pointsRedeemed = 50;
      loyaltyDiscount = 25.0;
      // Cap loyalty discount so total discount doesn't exceed subtotal
      if (couponDiscount + loyaltyDiscount > calculatedSubtotal) {
        loyaltyDiscount = Math.max(0, calculatedSubtotal - couponDiscount);
      }
    }

    const totalDiscount = couponDiscount + loyaltyDiscount;

    // 7. 5% Street Food Composite GST
    const taxableAmount = Math.max(0, calculatedSubtotal - totalDiscount);
    const gstAmount = Number((taxableAmount * 0.05).toFixed(2));
    const grandTotal = Number((taxableAmount + gstAmount + deliveryFee).toFixed(2));

    // 8. Generate Next Monotonic Token Sequence (101 -> 999)
    let nextToken = 101;
    if (storeSetting) {
      nextToken = storeSetting.currentTokenSequence >= 999 ? 101 : storeSetting.currentTokenSequence + 1;
      await prisma.storeSetting.update({
        where: { id: "primary" },
        data: { currentTokenSequence: nextToken },
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const orderNumber = `MPC-${dateStr}-${String(nextToken).padStart(4, "0")}`;

    // 9. Initial Payment & Order Status
    const isOnlinePayment = data.paymentMethod.startsWith("RAZORPAY");
    const initialStatus = isOnlinePayment ? "PENDING_PAYMENT" : "CONFIRMED";
    const initialPaymentStatus = isOnlinePayment ? "PENDING" : "PAID";

    // 10. Persist Order in Relational Database
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        tokenNo: nextToken,
        orderType: data.orderType,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        paymentMethod: data.paymentMethod,
        subtotal: calculatedSubtotal,
        gstAmount,
        discountAmount: totalDiscount,
        deliveryFee,
        totalAmount: grandTotal,
        tableNo: data.tableNo || null,
        pickupSlot: data.pickupSlot || (data.orderType === "TAKEAWAY" ? "Immediate Pickup (~10 mins)" : null),
        deliveryAddress: data.deliveryAddress ? sanitizeInput(data.deliveryAddress) : null,
        deliveryPincode: data.deliveryPincode || null,
        customerNotes: data.customerNotes ? sanitizeInput(data.customerNotes) : null,
        customerName: sanitizeInput(data.customerName),
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || null,
        userId: authUserId || null,
        idempotencyKey: data.idempotencyKey,
        prepStartedAt: !isOnlinePayment ? new Date() : null,
        items: {
          create: validatedItems.map((vi) => ({
            menuItemId: vi.menuItemId,
            itemTitle: vi.itemTitle,
            unitPrice: vi.unitPrice,
            quantity: vi.quantity,
            totalPrice: vi.totalPrice,
            selectedModifiersJson: vi.selectedModifiersJson,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 11. If COD or Counter Cash, deduct BOM inventory right away
    if (!isOnlinePayment) {
      try {
        await processOrderRecipeBOM(newOrder.id);
      } catch (bomErr) {
        console.error("Recipe BOM deduction non-fatal warning:", bomErr);
      }
    }

    // Award loyalty points to authenticated customer (10 points per order, minus any redeemed)
    if (authUserId) {
      const netPointsChange = 10 - pointsRedeemed;
      prisma.user
        .update({
          where: { id: authUserId },
          data: { loyaltyPoints: { increment: netPointsChange } },
        })
        .catch((err) => console.error("Loyalty points update non-fatal warning:", err));
    }

    // 12. If Razorpay, generate Gateway Order ID
    let gatewayOrder = null;
    if (isOnlinePayment) {
      gatewayOrder = await razorpayService.createGatewayOrder({
        amountInRupees: grandTotal,
        orderNumber: newOrder.orderNumber,
        notes: {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          customerPhone: newOrder.customerPhone,
        },
      });
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
      gatewayOrder,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mumbaipav2026",
      loyaltyDiscount,
      pointsRedeemed,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process order" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const orderType = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (orderType) {
      whereClause.orderType = orderType;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
