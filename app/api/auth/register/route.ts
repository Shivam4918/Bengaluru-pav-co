import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAuthToken, AUTH_COOKIE_NAME, UserRole } from "@/lib/auth";
import { registerUserSchema, sanitizeInput, normalizeIndianPhone } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (10 registration attempts per IP per 10 minutes)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`register:${clientIp}`, 10, 600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    // 2. Parse & Validate with registerUserSchema
    const body = await req.json();
    const parsed = registerUserSchema.safeParse(body);
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

    const { name, email, password, phone, dateOfBirth } = parsed.data;
    const sanitizedName = sanitizeInput(name);
    const normalizedEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? normalizeIndianPhone(phone) : null;

    // 3. Prevent duplicate email registration
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "This email address is already registered. Please sign in instead." },
        { status: 409 }
      );
    }

    // 4. Prevent duplicate phone registration if phone is supplied
    if (cleanPhone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: cleanPhone },
        select: { id: true },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "This mobile number is already linked to another account." },
          { status: 409 }
        );
      }
    }

    // 5. Securely hash password with bcrypt (salt factor 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Create customer record with 50 welcome loyalty points
    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: normalizedEmail,
        passwordHash,
        phone: cleanPhone,
        role: "CUSTOMER",
        loyaltyPoints: 50,
      },
    });

    // 7. Generate cryptographic session token
    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    });

    const response = NextResponse.json({
      success: true,
      message: "🎉 Welcome to Mumbai Pav Co.! 50 bonus loyalty points added.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please check your information and try again." },
      { status: 500 }
    );
  }
}
