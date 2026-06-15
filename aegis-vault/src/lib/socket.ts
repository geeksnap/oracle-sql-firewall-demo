"use client";

import { io, type Socket } from "socket.io-client";
import type {
  DashboardMetrics,
  FirewallViolation,
  MonitoredAppStatus,
} from "@lib/types";

export type AegisSocket = Socket<
  {
    "server-ready": (payload: { pdb: string; user: string }) => void;
    violation: (violation: FirewallViolation) => void;
    "attack-alert": (payload: {
      message: string;
      violation: FirewallViolation;
    }) => void;
    metrics: (metrics: DashboardMetrics) => void;
    "monitored-apps": (apps: MonitoredAppStatus[]) => void;
    "violations-snapshot": (violations: FirewallViolation[]) => void;
    "db-status": (status: {
      connected: boolean;
      polled_at?: string;
      error?: string;
      cycle_ms?: number;
      violation_count?: number;
      new_violations?: number;
    }) => void;
  },
  Record<string, never>
>;

let socket: AegisSocket | null = null;

export function getSocket(): AegisSocket {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    }) as AegisSocket;
  }
  return socket;
}
