import { type NextRequest, NextResponse } from "next/server";
import { filterTransactions } from "@/lib/db/vulnerable-queries";

// ⚠  INTENTIONALLY VULNERABLE — DEMO ONLY
// This route uses raw SQL string concatenation (see vulnerable-queries.ts).
// Institutional Transaction Lookup (Attack Point 2) posts { ref } here.
// Payload x' OR user_id<>1 -- breaks out of the user_id=1 scope and
// returns transactions for all seeded users in the firm ledger.
// Oracle SQL Firewall logs this to SYS.DBA_SQL_FIREWALL_VIOLATIONS (user: luminaforge).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { ref?: unknown };
    const ref = String(body.ref ?? "");
    const rows = await filterTransactions(ref);
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ rows: [], error: message }, { status: 200 });
  }
}
