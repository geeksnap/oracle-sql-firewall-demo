import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { DemoSeedEnvironment } from "./demo-seed-config";

export const BREAK_GLASS_COOKIE = "aegis_break_glass_grant";
const GRANT_TTL_SECONDS = 5 * 60;

interface GrantPayload {
  aud: "demo-seed";
  sub: string;
  exp: number;
}

function secret(env: DemoSeedEnvironment = process.env): string {
  const value = env.BREAK_GLASS_GRANT_SECRET ?? "";
  if (value.length < 32) {
    throw new Error("BREAK_GLASS_GRANT_SECRET must contain at least 32 characters");
  }
  return value;
}

function sign(encodedPayload: string, env?: DemoSeedEnvironment): string {
  return createHmac("sha256", secret(env))
    .update(encodedPayload)
    .digest("base64url");
}

export function issueBreakGlassGrant(
  username: string,
  nowMs = Date.now(),
  env?: DemoSeedEnvironment,
): string {
  const payload: GrantPayload = {
    aud: "demo-seed",
    sub: username,
    exp: Math.floor(nowMs / 1000) + GRANT_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, env)}`;
}

export function verifyBreakGlassGrant(
  token: string | undefined,
  nowMs = Date.now(),
  env?: DemoSeedEnvironment,
): GrantPayload | null {
  if (!token) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  const expected = sign(encoded, env);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as GrantPayload;
    if (
      payload.aud !== "demo-seed" ||
      !payload.sub ||
      payload.exp <= Math.floor(nowMs / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function hasSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function setBreakGlassGrantCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(BREAK_GLASS_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GRANT_TTL_SECONDS,
  });
}

export function clearBreakGlassGrantCookie(response: NextResponse): void {
  response.cookies.set(BREAK_GLASS_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
