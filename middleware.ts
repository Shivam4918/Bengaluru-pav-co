import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING =
  process.env.AUTH_SECRET || "mumbai-pav-co-ultra-secure-jwt-secret-key-2026-production";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("mpc_token")?.value;

  // Cryptographically verify session token
  let session: { userId: string; role: string; email: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = {
        userId: payload.userId as string,
        role: payload.role as string,
        email: payload.email as string,
      };
    } catch {
      session = null;
    }
  }

  // 1. Guard Admin HQ Routes (Owner / Admin Only)
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "ADMIN") {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set(
        "error",
        session ? "Access denied. Store Admin privileges required." : "Admin authentication required. Please sign in."
      );
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Guard Kitchen Display System (Kitchen Staff & Admin)
  if (pathname.startsWith("/kds")) {
    if (!session || (session.role !== "KITCHEN_STAFF" && session.role !== "ADMIN")) {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "Kitchen Staff authorization required.");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Guard Express Counter POS (Cashier & Admin)
  if (pathname.startsWith("/pos")) {
    if (!session || (session.role !== "CASHIER" && session.role !== "ADMIN")) {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "Counter Cashier authorization required.");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/kds/:path*", "/pos/:path*"],
};
