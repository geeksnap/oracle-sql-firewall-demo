import oracledb from "oracledb";
import type {
  AllowListPolicy,
  DashboardMetrics,
  FirewallControlTone,
  FirewallDefenceStatus,
  FirewallPolicy,
  FirewallViolation,
  MonitoredAppStatus,
  MonitoredUser,
} from "../types";
import type { Connection } from "oracledb";
import { mapUsernameToSourceApp, withConnection } from "./pool";
import { VIOLATION_LEDGER_LIMIT } from "../violation-ledger";

let flushGrantWarningLogged = false;
let lastFlushMs = 0;
const FLUSH_MIN_INTERVAL_MS = Number(
  process.env.FLUSH_MIN_INTERVAL_MS ?? 5000,
);

/** Max violation rows fetched for dashboard metrics (Total / LuminaForge / Aegis Hits). */
export const METRICS_VIOLATION_LIMIT = VIOLATION_LEDGER_LIMIT;

export interface PollSnapshot {
  violations: FirewallViolation[];
  policies: FirewallPolicy[];
  metrics: DashboardMetrics;
  apps: MonitoredAppStatus[];
}

function normalizeSqlKey(sqlText: string): string {
  return sqlText.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * SQL identity for a violation (username + normalized SQL or signature).
 * Pair with occurred_at for row-level ids in mapViolationRow.
 */
export function violationStableKey(
  username: string,
  sqlSignature: string | undefined,
  sqlText: string,
): string {
  const user = username.toUpperCase();
  const sqlKey = normalizeSqlKey(sqlText).slice(0, 400);
  if (sqlKey.length >= 8) return `${user}|sql:${sqlKey}`;
  const sig = sqlSignature?.trim();
  if (sig) return `${user}|sig:${sig}`;
  return `${user}|empty`;
}

function normalizeOccurredAt(occurredAt: unknown): string {
  const d =
    occurredAt instanceof Date
      ? occurredAt
      : new Date(String(occurredAt ?? ""));
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export function mapViolationActionLabel(firewallAction?: string): string {
  const raw = (firewallAction ?? "").trim();
  const upper = raw.toUpperCase();
  if (!upper) return "Unknown";
  if (
    upper === "BLOCK" ||
    upper === "BLOCKED" ||
    upper === "Y" ||
    upper === "TRUE" ||
    upper === "1" ||
    upper.includes("BLOCK")
  ) {
    return "Blocked";
  }
  if (
    upper === "LOG" ||
    upper === "LOGGED" ||
    upper === "ALLOW" ||
    upper === "ALLOWED" ||
    upper === "PASSED" ||
    upper === "PASS" ||
    upper === "N" ||
    upper === "FALSE" ||
    upper === "0"
  ) {
    return "Logged without Block";
  }
  return raw;
}

function mapViolationRow(
  row: Record<string, unknown>,
  rowIndex: number,
): FirewallViolation {
  const username = String(row.USERNAME ?? row.username ?? "UNKNOWN");
  const sqlText = String(row.SQL_TEXT ?? row.sql_text ?? "").slice(0, 2000);
  const occurred = normalizeOccurredAt(row.OCCURRED_AT ?? row.occurred_at);
  const sqlSignature = String(
    row.SQL_SIGNATURE ?? row.sql_signature ?? "",
  ).trim();
  const firewallAction = String(
    row.FIREWALL_ACTION ?? row.firewall_action ?? "",
  ).trim();

  const sqlKey = violationStableKey(username, sqlSignature || undefined, sqlText);

  return {
    // occurred_at + row index so flush duplicates in one fetch stay distinct in the ledger.
    id: `${sqlKey}|${occurred}|${rowIndex}`,
    username,
    source_app: mapUsernameToSourceApp(username),
    sql_text: sqlText,
    occurred_at: occurred,
    violation_type: String(row.CAUSE ?? row.cause ?? "UNKNOWN"),
    firewall_action: firewallAction || undefined,
    action_label: mapViolationActionLabel(firewallAction),
    client_ip:
      row.IP_ADDRESS != null
        ? String(row.IP_ADDRESS)
        : row.ip_address != null
          ? String(row.ip_address)
          : undefined,
  };
}

function parseBlock(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const u = value.trim().toUpperCase();
    return u === "TRUE" || u === "Y" || u === "YES" || u === "1" || u === "ON";
  }
  return false;
}

function resolveAllowListBlock(row: Record<string, unknown>): boolean {
  if (parseBlock(row.BLOCK ?? row.block ?? row.BLOCK_YN ?? row.block_yn)) {
    return true;
  }
  const enforce = String(row.ENFORCE ?? row.enforce ?? "").toUpperCase();
  return enforce.includes("BLOCK");
}

function mapAllowListRow(row: Record<string, unknown>): AllowListPolicy {
  return {
    username: String(row.USERNAME ?? row.username ?? ""),
    status: String(row.STATUS ?? row.status ?? "UNKNOWN").toUpperCase(),
    block: resolveAllowListBlock(row),
    enforce:
      row.ENFORCE != null
        ? String(row.ENFORCE)
        : row.enforce != null
          ? String(row.enforce)
          : undefined,
  };
}

/** True when AEGIS_APP allow-list is ENABLED — Demo Control PL/SQL will hit ORA-47605. */
export async function fetchAegisSocAllowListEnforced(): Promise<boolean> {
  return withConnection(async (connection) => {
    try {
      const result = await connection.execute<Record<string, unknown>>(
        `SELECT status FROM sys.dba_sql_firewall_allow_lists
         WHERE UPPER(username) = 'AEGIS_APP'`,
      );
      const row = result.rows?.[0];
      if (!row) return false;
      const status = String(row.STATUS ?? row.status ?? "").toUpperCase();
      return status === "ENABLED";
    } catch {
      return false;
    }
  });
}

export async function fetchGlobalFirewallEnabled(
  connection: Connection,
): Promise<boolean> {
  try {
    const result = await connection.execute(
      `SELECT status FROM sys.dba_sql_firewall_status`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const row = result.rows?.[0] as { STATUS?: string; status?: string } | undefined;
    const status = String(row?.STATUS ?? row?.status ?? "ENABLED").toUpperCase();
    return status === "ENABLED" || status === "ON" || status === "TRUE";
  } catch {
    return true;
  }
}

async function fetchViewAllowListCursor(
  connection: Connection,
  username: string,
): Promise<Record<string, unknown>[]> {
  const result = await connection.execute(
    `BEGIN SYS.aegis_demo_control.view_allow_list('${username}', :cur); END;`,
    { cur: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
  );
  const out = result.outBinds as {
    cur?: import("oracledb").ResultSet<Record<string, unknown>>;
  };
  const rs = out?.cur;
  if (!rs) return [];
  try {
    return (await rs.getRows(10)) as Record<string, unknown>[];
  } finally {
    await rs.close();
  }
}

async function fetchAllowLists(connection: Connection): Promise<AllowListPolicy[]> {
  const sql = `
    SELECT username, status, block, enforce
    FROM sys.dba_sql_firewall_allow_lists
    WHERE UPPER(username) IN ('AEGIS_APP', 'LUMINAFORGE')
    ORDER BY username
  `;
  try {
    const result = await connection.execute<Record<string, unknown>>(sql);
    return (result.rows ?? []).map(mapAllowListRow);
  } catch {
    const users = ["AEGIS_APP", "LUMINAFORGE"] as const;
    const rows: AllowListPolicy[] = [];
    for (const user of users) {
      try {
        const cursorRows = await fetchViewAllowListCursor(connection, user);
        for (const row of cursorRows) {
          rows.push(mapAllowListRow(row));
        }
      } catch {
        /* skip user */
      }
    }
    return rows;
  }
}

export function mapFirewallControlLabel(
  globalEnabled: boolean,
  allowList?: AllowListPolicy,
  dbUser?: string,
  capture?: FirewallPolicy,
): {
  label: string;
  tone: FirewallControlTone;
  defence_status: FirewallDefenceStatus;
} {
  if (!globalEnabled) {
    return {
      label: "FIREWALL OFF",
      tone: "off",
      defence_status: "firewall-off",
    };
  }

  const user = (dbUser ?? allowList?.username ?? "").toUpperCase();
  if (user === "AEGIS_APP") {
    return {
      label: "DETECT · LOG ONLY",
      tone: "warn",
      defence_status: "enforced-log",
    };
  }

  if (!allowList) {
    const captureOn = capture?.state?.toUpperCase() === "ENABLED";
    if (captureOn) {
      return {
        label: "CAPTURE ACTIVE",
        tone: "warn",
        defence_status: "capture-active",
      };
    }
    if (capture) {
      return {
        label: "READY FOR CAPTURE",
        tone: "off",
        defence_status: "ready-for-capture",
      };
    }
    return {
      label: "POLICY CLEARED",
      tone: "off",
      defence_status: "policy-cleared",
    };
  }
  if (allowList.status !== "ENABLED") {
    if (allowList.block) {
      return {
        label: "SQL MONITOR OFF · BLOCK ON",
        tone: "warn",
        defence_status: "allow-list-off-block-armed",
      };
    }
    return {
      label: "SQL MONITOR OFF",
      tone: "off",
      defence_status: "allow-list-off",
    };
  }
  if (allowList.block) {
    return {
      label: "ENFORCED · BLOCK",
      tone: "protect",
      defence_status: "enforced-block",
    };
  }
  return {
    label: "ENFORCED · LOG",
    tone: "warn",
    defence_status: "enforced-log",
  };
}

function buildMonitoredApps(
  violations: FirewallViolation[],
  captures: FirewallPolicy[],
  allowLists: AllowListPolicy[],
  globalFirewallEnabled: boolean,
): MonitoredAppStatus[] {
  const captureByUser = new Map(
    captures.map((p) => [p.username.toUpperCase(), p]),
  );
  const allowByUser = new Map(
    allowLists.map((a) => [a.username.toUpperCase(), a]),
  );

  const dbUser = "LUMINAFORGE";
  const violationCount = violations.filter(
    (v) => v.username.toUpperCase() === dbUser,
  ).length;
  const capture = captureByUser.get(dbUser);
  const allow = allowByUser.get(dbUser);
  const {
    label: firewall_control_label,
    tone: firewall_control_tone,
    defence_status,
  } = mapFirewallControlLabel(globalFirewallEnabled, allow, dbUser, capture);

  return [
    {
      id: "luminaforge",
      label: "LuminaForge",
      username: "luminaforge",
      status: violationCount > 0 ? "alert" : "online",
      has_alert: violationCount > 0,
      firewall_control_label,
      firewall_control_tone,
      defence_status,
      sql_monitor_enabled: allow?.status === "ENABLED",
      block_sql: allow?.block ?? false,
      capture_active: capture?.state?.toUpperCase() === "ENABLED",
      violation_count: violationCount,
    },
  ];
}

function buildMetrics(
  violations: FirewallViolation[],
  globalFirewallEnabled: boolean,
): DashboardMetrics {
  const luminaforge = violations.filter((v) => v.source_app === "luminaforge");
  const aegis = violations.filter((v) => v.source_app === "AEGIS_APP");

  return {
    total_violations: violations.length,
    luminaforge_violations: luminaforge.length,
    aegis_violations: aegis.length,
    firewall_enabled: globalFirewallEnabled,
    last_poll_at: new Date().toISOString(),
  };
}

async function flushFirewallLogs(
  connection: Connection,
  force = false,
): Promise<boolean> {
  const now = Date.now();
  if (!force && now - lastFlushMs < FLUSH_MIN_INTERVAL_MS) {
    return true;
  }

  try {
    await connection.execute(`BEGIN SYS.aegis_fw_flush_logs; END;`);
    lastFlushMs = now;
    return true;
  } catch {
    try {
      await connection.execute(`BEGIN SYS.DBMS_SQL_FIREWALL.FLUSH_LOGS; END;`);
      lastFlushMs = now;
      return true;
    } catch {
      return false;
    }
  }
}

/** One DB round-trip per status-update cycle — avoids stacked remote queries on OCI. */
export async function fetchPollSnapshot(
  violationLimit = METRICS_VIOLATION_LIMIT,
  options?: { forceFlush?: boolean },
): Promise<PollSnapshot> {
  return withConnection(async (connection) => {
    const flushed = await flushFirewallLogs(
      connection,
      options?.forceFlush ?? false,
    );
    const globalFirewallEnabled = await fetchGlobalFirewallEnabled(connection);

    const violationsSql = `
      SELECT *
      FROM (
        SELECT
          username,
          sql_text,
          sql_signature,
          occurred_at,
          firewall_action,
          cause,
          ip_address
        FROM sys.dba_sql_firewall_violations
        WHERE UPPER(username) IN ('AEGIS_APP', 'LUMINAFORGE')
        ORDER BY occurred_at DESC
      )
      WHERE ROWNUM <= :limit
    `;

    const capturesSql = `
      SELECT username, status, top_level_only, last_started_on
      FROM sys.dba_sql_firewall_captures
      WHERE UPPER(username) IN ('AEGIS_APP', 'LUMINAFORGE')
      ORDER BY username
    `;

    const [violationsResult, capturesResult, allowLists] = await Promise.all([
      connection.execute<Record<string, unknown>>(violationsSql, {
        limit: violationLimit,
      }),
      connection.execute<Record<string, unknown>>(capturesSql).catch(() => ({
        rows: [] as Record<string, unknown>[],
      })),
      fetchAllowLists(connection),
    ]);

    const violations = (violationsResult.rows ?? []).map((row, i) =>
      mapViolationRow(row, i),
    );
    if (!flushed && !flushGrantWarningLogged) {
      flushGrantWarningLogged = true;
      console.warn(
        "[aegis-vault] FLUSH_LOGS unavailable — run Oracle_DB_Aegis_Flush_Grant.sql as SYS (violations may lag ~1 min)",
      );
    }

    const policies = (capturesResult.rows ?? []).map((row) => {
      const status = String(row.STATUS ?? row.status ?? "UNKNOWN").toUpperCase();
      return {
        username: String(row.USERNAME ?? row.username ?? ""),
        state: status,
        enforcement_level: row.TOP_LEVEL_ONLY
          ? String(row.TOP_LEVEL_ONLY)
          : undefined,
      };
    });

    return {
      violations,
      policies,
      metrics: buildMetrics(violations, globalFirewallEnabled),
      apps: buildMonitoredApps(
        violations,
        policies,
        allowLists,
        globalFirewallEnabled,
      ),
    };
  });
}

export async function fetchViolations(
  userFilter: MonitoredUser = "ALL",
  limit = 50,
): Promise<FirewallViolation[]> {
  const snapshot = await fetchPollSnapshot(Math.max(limit, 50));
  if (userFilter === "ALL") return snapshot.violations.slice(0, limit);
  if (userFilter === "AEGIS_APP") {
    return snapshot.violations
      .filter((v) => v.username.toUpperCase() === "AEGIS_APP")
      .slice(0, limit);
  }
  return snapshot.violations
    .filter((v) => v.username.toUpperCase() === "LUMINAFORGE")
    .slice(0, limit);
}

export async function fetchPolicies(): Promise<FirewallPolicy[]> {
  const snapshot = await fetchPollSnapshot(1);
  return snapshot.policies;
}

export async function fetchMonitoredApps(): Promise<MonitoredAppStatus[]> {
  const snapshot = await fetchPollSnapshot(50);
  return snapshot.apps;
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const snapshot = await fetchPollSnapshot(METRICS_VIOLATION_LIMIT);
  return snapshot.metrics;
}

export async function testConnection(): Promise<boolean> {
  try {
    await withConnection(async (connection) => {
      await connection.execute("SELECT 1 FROM DUAL");
    });
    return true;
  } catch {
    return false;
  }
}
