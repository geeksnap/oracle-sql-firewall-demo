import { NextResponse } from "next/server";
import { createBreakGlassViolation } from "@lib/break-glass";
import { pushBreakGlassViolation } from "@lib/break-glass-store";
import { emitBreakGlassViolation } from "@lib/poller-registry";
import {
  issueBreakGlassGrant,
  setBreakGlassGrantCookie,
} from "@lib/break-glass-grant";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: unknown;
      password?: unknown;
    };

    const username = String(body.username ?? "").trim();
    if (!username) {
      return NextResponse.json(
        { error: "Break-Glass User is required" },
        { status: 400 },
      );
    }

    // Demo mode: password accepted but not validated or logged
    void body.password;

    const grant =
      process.env.DEMO_SEED_RESET_ENABLED === "true"
        ? issueBreakGlassGrant(username)
        : null;
    const violation = createBreakGlassViolation(username);
    pushBreakGlassViolation(violation);
    emitBreakGlassViolation(violation);

    const response = NextResponse.json({
      violation,
      seedGrantIssued: grant !== null,
    });
    if (grant) setBreakGlassGrantCookie(response, grant);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
