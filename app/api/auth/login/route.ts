import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAuthToken, AUTH_COOKIE_NAME, UserRole } from "@/lib/auth";
import { loginUserSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (12 attempts per IP per 5 minutes to prevent brute-force attacks)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`login:${clientIp}`, 12, 300);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${rateCheck.resetInSeconds} seconds before trying again.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = loginUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Please provide both a valid email and password." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Look up user strictly by unique email address
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Verify salted password hash with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Generate cryptographic enterprise JWT token
    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
    });

    // Set secure, HttpOnly session cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Authentication service error. Please try again." },
      { status: 500 }
    );
  }
}
