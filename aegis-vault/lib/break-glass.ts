import type { FirewallViolation } from "./types";

export function createBreakGlassViolation(username: string): FirewallViolation {
  const occurred_at = new Date().toISOString();
  const trimmed = username.trim();

  return {
    id: `break-glass|${occurred_at}|${trimmed}`,
    username: trimmed,
    source_app: "Aegis Vault",
    sql_text: "N/A",
    occurred_at,
    detected_at: occurred_at,
    violation_type: "BREAK_GLASS",
    action_label: "Break-Glass Logged in",
  };
}
