import { type NextRequest, NextResponse } from "next/server";
import { generateStatement } from "@/lib/db/vulnerable-queries";

// ⚠  INTENTIONALLY VULNERABLE — DEMO ONLY
// This route uses raw SQL string concatenation (see vulnerable-queries.ts).
// The base SELECT uses TO_CHAR so all 4 columns are VARCHAR2, making them
// UNION-compatible with users(id NUMBER, username VARCHAR2, password VARCHAR2, role VARCHAR2).
// Payload: 0 UNION SELECT TO_CHAR(id), username, password, role FROM users
// leaks plaintext credentials directly into the statement grid.
// Oracle SQL Firewall logs this to SYS.DBA_SQL_FIREWALL_VIOLATIONS (user: luminaforge).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { taxId?: unknown };
    const taxId = String(body.taxId ?? "0");
    const rows = await generateStatement(taxId);
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ rows: [], error: message }, { status: 200 });
  }
}
