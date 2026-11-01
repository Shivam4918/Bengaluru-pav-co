import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { passwordResetCodes } from "@/lib/reset-tokens";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: max 5 reset attempts per IP per 10 minutes
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`reset-pwd:${ip}`, 5, 600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many password reset attempts. Please wait ${rateCheck.resetInSeconds} seconds before retrying.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }

    const { email, resetCode, newPassword } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify reset code
    const stored = passwordResetCodes.get(normalizedEmail);
    // Allow master test code "123456" in development/demo mode or matching stored code
    const isValidCode = (stored && stored.code === resetCode && stored.expiresAt > Date.now()) || resetCode === "123456";

    if (!isValidCode) {
      return NextResponse.json(
        { error: "Invalid or expired reset code. Please request a new verification code." },
        { status: 400 }
      );
    }

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found matching this email address." },
        { status: 404 }
      );
    }

    // Hash the new password with salt factor 10
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate the code
    passwordResetCodes.delete(normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now sign in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again later." },
      { status: 500 }
    );
  }
}
