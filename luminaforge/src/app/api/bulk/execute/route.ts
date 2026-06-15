import { type NextRequest, NextResponse } from "next/server";
import { executeBulkAction } from "@/lib/db/vulnerable-queries";

// ⚠  INTENTIONALLY VULNERABLE — DEMO ONLY
// This route uses raw SQL string concatenation and splits on ';' to execute
// stacked statements (see vulnerable-queries.ts).
// node-oracledb does not support multi-statement execute — the deliberate
// split-and-loop makes stacked queries work.
// Payload: ; UPDATE users SET role='admin' WHERE id=1 -- (ok'; prefix also accepted)
// runs the injected UPDATE silently while the UI shows "Transfer complete".
// Oracle SQL Firewall logs each statement to SYS.DBA_SQL_FIREWALL_VIOLATIONS
// (user: luminaforge).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { note?: unknown };
    const note = String(body.note ?? "");
    const result = await executeBulkAction(note);
    return NextResponse.json({
      status: "Transfer complete",
      stmtsExecuted: result.stmtsExecuted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", error: message }, { status: 200 });
  }
}
