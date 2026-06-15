import { NextResponse } from "next/server";
import { fetchMetrics, fetchMonitoredApps, testConnection } from "@lib/db/queries";

export async function GET() {
  try {
    const [metrics, apps, connected] = await Promise.all([
      fetchMetrics(),
      fetchMonitoredApps(),
      testConnection(),
    ]);
    return NextResponse.json({ metrics, apps, connected });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
