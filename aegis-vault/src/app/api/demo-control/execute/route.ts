import { NextRequest, NextResponse } from "next/server";
import {
  executeDemoAction,
  isValidDemoRequest,
  type DemoAction,
  type DemoScope,
} from "@lib/db/demo-control";
import { fetchPollSnapshot, METRICS_VIOLATION_LIMIT } from "@lib/db/queries";
import { requestPollRefresh, requestPollReset } from "@lib/poller-registry";

export async function POST(request: NextRequest) {
  let body: { scope?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { scope, action } = body;
  if (!scope || !action || !isValidDemoRequest(scope, action)) {
    return NextResponse.json(
      { error: "Invalid scope or action for demo control" },
      { status: 400 },
    );
  }

  const result = await executeDemoAction(scope as DemoScope, action as DemoAction);

  if (result.ok && result.mutating) {
    try {
      const snapshot = await fetchPollSnapshot(METRICS_VIOLATION_LIMIT, {
        forceFlush: true,
      });
      result.apps = snapshot.apps;
      result.metrics = snapshot.metrics;
    } catch {
      /* socket refresh will catch up */
    }
    // After purge-violations reset dedup state so next attack triggers fresh alerts
    if (action === "purge-violations") {
      requestPollReset();
    } else {
      requestPollRefresh();
    }
  }

  return NextResponse.json(result);
}
