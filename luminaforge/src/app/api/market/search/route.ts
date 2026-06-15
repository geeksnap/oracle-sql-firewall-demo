import { type NextRequest, NextResponse } from "next/server";
import { searchLuxuryItems } from "@/lib/db/vulnerable-queries";

export const dynamic = "force-dynamic";

// ⚠  INTENTIONALLY VULNERABLE — DEMO ONLY
// This route uses raw SQL string concatenation (see vulnerable-queries.ts).
// Attack Point 1 ladder: step 1 boolean bypass; step 2 user_tables;
//   step 3 user_tab_columns for a table from step 2 (e.g. USERS).
// Oracle SQL Firewall logs this to SYS.DBA_SQL_FIREWALL_VIOLATIONS (user: luminaforge).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { q?: unknown };
    const q = String(body.q ?? "");
    const rows = await searchLuxuryItems(q);
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ rows: [], error: message }, { status: 200 });
  }
}
