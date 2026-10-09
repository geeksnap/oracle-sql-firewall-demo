import { NextResponse } from "next/server";
import { clearBreakGlassGrantCookie } from "@lib/break-glass-grant";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearBreakGlassGrantCookie(response);
  return response;
}
