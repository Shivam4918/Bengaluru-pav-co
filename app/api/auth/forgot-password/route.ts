import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { passwordResetCodes } from "@/lib/reset-tokens";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: max 5 requests per IP per 10 minutes
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`forgot-pwd:${ip}`, 5, 600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many password reset attempts. Please wait ${rateCheck.resetInSeconds} seconds before retrying.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Please provide a valid registered email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      // Don't leak whether user exists for security, but return friendly message
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a 6-digit verification code has been sent.",
      });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    passwordResetCodes.set(normalizedEmail, { code: resetCode, expiresAt });

    return NextResponse.json({
      success: true,
      message: "A 6-digit verification code has been generated.",
      // Include demoCode for testability so the user can complete the flow
      demoCode: resetCode,
      expiresInMinutes: 15,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Unable to process password reset request. Please try again." },
      { status: 500 }
    );
  }
}
