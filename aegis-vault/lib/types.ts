export type MonitoredUser = "AEGIS_APP" | "LUMINAFORGE" | "ALL";

export type FirewallControlTone = "protect" | "warn" | "off" | "unknown";

export type FirewallDefenceStatus =
  | "enforced-block"
  | "enforced-log"
  | "allow-list-off"
  | "allow-list-off-block-armed"
  | "firewall-off"
  | "policy-cleared"
  | "ready-for-capture"
  | "capture-active"
  | "not-configured";

export interface FirewallViolation {
  id: string;
  username: string;
  source_app: "AEGIS_APP" | "luminaforge" | "Aegis Vault";
  sql_text: string;
  occurred_at: string;
  /** When Aegis Vault first saw this row (not Oracle event time). */
  detected_at?: string;
  /** SQL Firewall cause (DBA_SQL_FIREWALL_VIOLATIONS.CAUSE). */
  violation_type: string;
  /** Raw FIREWALL_ACTION from dictionary. */
  firewall_action?: string;
  /** Human-readable enforcement outcome for UI. */
  action_label: string;
  client_ip?: string;
}

export interface FirewallPolicy {
  username: string;
  state: string;
  enforcement_level?: string;
}

export interface AllowListPolicy {
  username: string;
  status: string;
  block: boolean;
  enforce?: string;
}

export interface MonitoredAppStatus {
  id: "AEGIS_APP" | "luminaforge";
  label: string;
  username: string;
  /** @deprecated Use has_alert + firewall_control_label in UI */
  status: "online" | "offline" | "alert";
  has_alert: boolean;
  firewall_control_label: string;
  firewall_control_tone: FirewallControlTone;
  defence_status: FirewallDefenceStatus;
  sql_monitor_enabled: boolean;
  block_sql: boolean;
  capture_active: boolean;
  violation_count: number;
}

/** Right-rail / policy view — same posture as Monitored Apps */
export type FirewallPosture = MonitoredAppStatus;

export interface DashboardMetrics {
  total_violations: number;
  luminaforge_violations: number;
  aegis_violations: number;
  firewall_enabled: boolean;
  last_poll_at: string;
}
