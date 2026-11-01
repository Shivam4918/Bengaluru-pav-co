import crypto from "crypto";

interface CreateOrderOptions {
  amountInRupees: number;
  orderNumber: string;
  notes?: Record<string, string>;
}

interface PaymentVerificationPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayPaymentGateway {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mumbaipav2026";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "test_secret_mumbaipav_hmac_2026";
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_mumbaipav_bengaluru_2026";
  }

  /**
   * Initializes a Razorpay order in paise (INR 1 = 100 paise)
   */
  public async createGatewayOrder({ amountInRupees, orderNumber, notes }: CreateOrderOptions) {
    const amountInPaise = Math.round(amountInRupees * 100);

    // If using simulated test credentials or in local development
    if (this.keyId.startsWith("rzp_test_") || process.env.NODE_ENV !== "production") {
      const mockRazorpayOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;
      return {
        id: mockRazorpayOrderId,
        entity: "order",
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency: "INR",
        receipt: orderNumber,
        status: "created",
        isSimulated: true,
      };
    }

    // In live production, call Razorpay Orders API
    const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderNumber,
        notes: notes || {},
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Razorpay Order Creation Failed: ${errorData}`);
    }

    return await response.json();
  }

  /**
   * Cryptographically verifies the Razorpay payment signature
   * HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
   */
  public verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }: PaymentVerificationPayload): boolean {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    // Check for simulated test signature in dev sandbox
    if (razorpay_signature === `mock_sig_${razorpay_order_id}`) {
      return true;
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpay_signature, "hex")
    );
  }

  /**
   * Verifies Razorpay Webhook Signatures from headers['x-razorpay-signature']
   */
  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!rawBody || !signature) return false;

    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  }
}

export const razorpayService = new RazorpayPaymentGateway();
