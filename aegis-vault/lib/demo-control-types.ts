export type DemoScope = "global" | "aegis" | "luminaforge";

export type DemoAction =
  | "firewall-disable"
  | "firewall-enable"
  | "block-on"
  | "block-off"
  | "capture-on"
  | "capture-off"
  | "generate-allow-list"
  | "sql-monitor-enable"
  | "sql-monitor-disable"
  | "purge-violations"
  | "clear-firewall-policy"
  | "init-default-policy"
  | "view-violations"
  | "view-sql-monitor"
  | "view-capture-status";

/** Shown in Demo Control modal after init-default-policy (capture left running). */
export interface InitManualFinalizeGuide {
  captureActive: true;
  stepsCompleted: string[];
  nextSteps: string[];
}

export const INIT_MANUAL_FINALIZE_STEPS_COMPLETED: readonly string[] = [
  "Cleared existing allow-list and capture for luminaforge",
  "Started SQL capture for LUMINAFORGE",
  "Seeded baseline benign SQL (bootstrap procedure)",
  "Captured LuminaForge app session context via /api/session and /api/portfolio",
];

export const INIT_MANUAL_FINALIZE_NEXT_STEPS: readonly string[] = [
  "Use LuminaForge normally — click through nav tabs and benign flows while capture is ON",
  "Click Stop SQL capture in §3.3 Firewall setup",
  "Click Generate Allow List (SQL Monitor ON, Block SQL OFF)",
];
