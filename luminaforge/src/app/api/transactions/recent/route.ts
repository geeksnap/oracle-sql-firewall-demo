import { type NextRequest, NextResponse } from "next/server";
import { listMyRecentTransactions } from "@/lib/db/safe-queries";

/** Safe parameterized query — demo user's latest N transactions (date-independent). */
export async function POST(req: NextRequest) {
  try {
    let limit = 10;
    try {
      const body = (await req.json()) as { limit?: unknown };
      if (body.limit != null) {
        const n = Number(body.limit);
        if (Number.isFinite(n) && n > 0 && n <= 100) limit = Math.floor(n);
      }
    } catch {
      // empty body → default 10 rows
    }

    const rows = await listMyRecentTransactions(limit);
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ rows: [], error: message }, { status: 200 });
  }
}
