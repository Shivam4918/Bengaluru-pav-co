import { SignJWT, jwtVerify } from "jose";

export type UserRole = "CUSTOMER" | "KITCHEN_STAFF" | "CASHIER" | "ADMIN" | "RIDER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  loyaltyPoints: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

// 256-bit cryptographic secret for Edge-ready JWT verification
const JWT_SECRET_STRING =
  process.env.AUTH_SECRET || "mumbai-pav-co-ultra-secure-jwt-secret-key-2026-production";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const AUTH_COOKIE_NAME = "mpc_token";

/**
 * Signs an enterprise cryptographic JWT valid for 7 days
 */
export async function signAuthToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Cryptographically verifies the JWT token
 */
export async function verifyAuthToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

// Client-side UI session helper (Optimistic UI display only; server security uses HttpOnly cookie)
export function getCurrentSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mpc_session_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSessionUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem("mpc_session_user");
  } else {
    localStorage.setItem("mpc_session_user", JSON.stringify(user));
  }
}
