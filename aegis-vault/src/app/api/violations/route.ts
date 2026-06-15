import { NextRequest, NextResponse } from "next/server";
import { fetchViolations } from "@lib/db/queries";
import type { MonitoredUser } from "@lib/types";

export async function GET(request: NextRequest) {
  const userParam = request.nextUrl.searchParams.get("user") ?? "all";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);

  let userFilter: MonitoredUser = "ALL";
  if (userParam.toLowerCase() === "aegis_app") userFilter = "AEGIS_APP";
  if (userParam.toLowerCase() === "luminaforge") userFilter = "LUMINAFORGE";

  try {
    const violations = await fetchViolations(userFilter, limit);
    return NextResponse.json({ violations, user: userParam });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
