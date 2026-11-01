import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EMAIL_REGEX } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ available: false, error: "Invalid email format" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return NextResponse.json({
      available: !existingUser,
      message: existingUser ? "This email address is already registered." : "Email is available.",
    });
  } catch (error) {
    return NextResponse.json({ available: false, error: "Service unavailable" }, { status: 500 });
  }
}

