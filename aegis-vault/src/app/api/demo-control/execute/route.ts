import { NextRequest, NextResponse } from "next/server";
import {
  executeDemoAction,
  isValidDemoRequest,
  type DemoAction,
  type DemoScope,
} from "@lib/db/demo-control";
import { fetchPollSnapshot, METRICS_VIOLATION_LIMIT } from "@lib/db/queries";
import { requestPollRefresh, requestPollReset } from "@lib/poller-registry";
import {
  BREAK_GLASS_COOKIE,
  clearBreakGlassGrantCookie,
  hasSameOrigin,
  verifyBreakGlassGrant,
} from "@lib/break-glass-grant";

export async function POST(request: NextRequest) {
  let body: { scope?: string; action?: string; confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { scope, action, confirmation } = body;
  if (!scope || !action || !isValidDemoRequest(scope, action)) {
    return NextResponse.json(
      { error: "Invalid scope or action for demo control" },
      { status: 400 },
    );
  }

  if (action === "initialize-demo-seed-data") {
    if (confirmation !== "RESET LUMINAFORGE DEMO DATA") {
      return NextResponse.json(
        { error: "Exact demo seed confirmation is required" },
        { status: 400 },
      );
    }
    if (scope !== "luminaforge" || !hasSameOrigin(request)) {
      return NextResponse.json(
        { error: "Demo seed initialization requires an authorized same-origin request" },
        { status: 403 },
      );
    }
    try {
      const grant = verifyBreakGlassGrant(
        request.cookies.get(BREAK_GLASS_COOKIE)?.value,
      );
      if (!grant) {
        return NextResponse.json(
          { error: "Break-glass authorization is required" },
          { status: 401 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Break-glass authorization is not configured" },
        { status: 503 },
      );
    }
  }

  const result = await executeDemoAction(scope as DemoScope, action as DemoAction);

  if (
    result.ok &&
    result.mutating &&
    action !== "initialize-demo-seed-data"
  ) {
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

  const response = NextResponse.json(result);
  if (action === "initialize-demo-seed-data") {
    clearBreakGlassGrantCookie(response);
  }
  return response;
}
