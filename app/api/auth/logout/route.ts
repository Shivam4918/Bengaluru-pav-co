import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete("mpc_role");
  response.cookies.delete("mpc_user_id");
  return response;
}
