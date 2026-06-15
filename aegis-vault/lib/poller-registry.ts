import type { Server as SocketServer } from "socket.io";
import type { FirewallViolation } from "./types";
import { runPollCycle, resetPollerState } from "./poller";

let pollerSocket: SocketServer | null = null;

export function registerPollerSocket(io: SocketServer): void {
  pollerSocket = io;
}

export function requestPollRefresh(): void {
  if (pollerSocket) {
    void runPollCycle(pollerSocket, { forceFlush: true });
  }
}

/** Clears dedup state then forces a fresh poll — call after purge-violations. */
export function requestPollReset(): void {
  resetPollerState();
  if (pollerSocket) {
    void runPollCycle(pollerSocket, { forceFlush: true });
  }
}

export function emitBreakGlassViolation(violation: FirewallViolation): void {
  if (!pollerSocket) return;
  pollerSocket.emit("violation", violation);
}
