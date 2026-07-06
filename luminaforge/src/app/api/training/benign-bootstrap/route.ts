import { NextResponse } from "next/server";
import {
  DEMO_USER_ID,
  fetchDemoSessionUser,
  fetchPortfolio,
  listMyRecentTransactions,
} from "@/lib/db/safe-queries";

/**
 * SQL Firewall capture training — runs benign LuminaForge SQL through this
 * app's Node pool (same session context as live tab navigation).
 * Called by Aegis Demo Control during init-default-policy.
 */
export async function GET() {
  try {
    await fetchDemoSessionUser(DEMO_USER_ID);
    await fetchPortfolio(DEMO_USER_ID);
    await listMyRecentTransactions(30, DEMO_USER_ID);
    // Navbar refetches session on every tab switch — train that shape repeatedly.
    await fetchDemoSessionUser(DEMO_USER_ID);
    await fetchDemoSessionUser(DEMO_USER_ID);
    await fetchDemoSessionUser(DEMO_USER_ID);

    return NextResponse.json({
      ok: true,
      trained: ["session", "portfolio", "transactions/recent", "session-tabs"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
