import { NextResponse } from "next/server";
import { fetchPortfolio } from "@/lib/db/safe-queries";

// SAFE — uses oracledb parameterized bind variables (no concatenation).
// This route is intentionally secure and serves as the contrast example
// for the 4 deliberately vulnerable routes.
export async function GET() {
  try {
    const rows = await fetchPortfolio(1);
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ rows: [], error: message }, { status: 200 });
  }
}
