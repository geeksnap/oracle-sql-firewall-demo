import type { Server as SocketServer } from "socket.io";
import { mergeWithBreakGlassViolations } from "./break-glass-store";
import {
  fetchPollSnapshot,
  METRICS_VIOLATION_LIMIT,
} from "./db/queries";
import type { FirewallViolation } from "./types";

/** Ids from the previous status-update ledger (for socket diff only). */
let previousLedgerIds = new Set<string>();

let pollCyclesCompleted = 0;
let pollInFlight = false;
let pendingRefresh = false;
let pendingForceFlush = false;
let lastCycleMs = 0;
let lastViolationCount = 0;

export function getPollerStats() {
  return {
    lastCycleMs,
    lastViolationCount,
    pollInFlight,
    intervalMs: Number(process.env.POLL_INTERVAL_MS ?? 1000),
  };
}

/** Clears ledger diff state after purge so the next poll re-baselines. */
export function resetPollerState(): void {
  previousLedgerIds = new Set();
  pollCyclesCompleted = 0;
  console.log("[aegis-vault] poller state reset (ledger diff cleared)");
}

export async function runPollCycle(
  io: SocketServer,
  options?: { forceFlush?: boolean },
): Promise<void> {
  if (pollInFlight) {
    pendingRefresh = true;
    if (options?.forceFlush) pendingForceFlush = true;
    return;
  }

  pollInFlight = true;
  const started = Date.now();

  try {
    const snapshot = await fetchPollSnapshot(METRICS_VIOLATION_LIMIT, {
      forceFlush: options?.forceFlush,
    });
    const violations = mergeWithBreakGlassViolations(
      snapshot.violations,
      METRICS_VIOLATION_LIMIT,
    );
    const { metrics, apps, policies } = snapshot;
    lastCycleMs = Date.now() - started;
    lastViolationCount = violations.length;

    const newViolations: FirewallViolation[] = [];
    const isBootstrapCycle = pollCyclesCompleted === 0;

    for (const violation of violations) {
      if (previousLedgerIds.has(violation.id)) continue;
      if (isBootstrapCycle) continue;
      newViolations.push({
        ...violation,
        detected_at: new Date().toISOString(),
      });
    }

    previousLedgerIds = new Set(violations.map((v) => v.id));
    pollCyclesCompleted += 1;

    for (const violation of newViolations) {
      io.emit("violation", violation);
      if (violation.source_app === "luminaforge") {
        io.emit("attack-alert", {
          message: "LuminaForge Attacked",
          violation,
        });
      }
    }

    io.emit("metrics", metrics);
    io.emit("monitored-apps", apps);
    io.emit("policies-snapshot", policies);
    io.emit("violations-snapshot", violations);
    io.emit("db-status", {
      connected: true,
      polled_at: metrics.last_poll_at,
      cycle_ms: lastCycleMs,
      violation_count: violations.length,
      new_violations: newViolations.length,
    });

    if (newViolations.length > 0) {
      console.log(
        `[aegis-vault] status update ${lastCycleMs}ms | total=${violations.length} | new=${newViolations.length}`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    lastCycleMs = Date.now() - started;
    console.error(`[aegis-vault] status update failed (${lastCycleMs}ms):`, message);
    io.emit("db-status", { connected: false, error: message, cycle_ms: lastCycleMs });
  } finally {
    pollInFlight = false;
    if (pendingRefresh) {
      const force = pendingForceFlush;
      pendingRefresh = false;
      pendingForceFlush = false;
      void runPollCycle(io, force ? { forceFlush: true } : undefined);
    }
  }
}

export function startViolationPoller(io: SocketServer): () => void {
  const intervalMs = Number(process.env.POLL_INTERVAL_MS ?? 1000);
  console.log(`[aegis-vault] status update interval ${intervalMs}ms (sequential, no overlap)`);

  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const scheduleNext = () => {
    if (stopped) return;
    timer = setTimeout(async () => {
      await runPollCycle(io);
      scheduleNext();
    }, intervalMs);
  };

  void runPollCycle(io).then(scheduleNext);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
