import { type NextRequest, NextResponse } from "next/server";
import { listMyRecentTransactions } from "@/lib/db/safe-queries";

/** Safe parameterized query — demo user transactions in the last N days. */
export async function POST(req: NextRequest) {
  try {
    let days = 30;
    try {
      const body = (await req.json()) as { days?: unknown };
      if (body.days != null) {
        const n = Number(body.days);
        if (Number.isFinite(n) && n > 0 && n <= 365) days = Math.floor(n);
      }
    } catch {
      // empty body → default 30 days
    }

    const rows = await listMyRecentTransactions(days);
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ rows: [], error: message }, { status: 200 });
  }
}
