import oracledb, { type Connection } from "oracledb";
import type { DemoAction, DemoScope, InitManualFinalizeGuide } from "../demo-control-types";
import {
  INIT_MANUAL_FINALIZE_NEXT_STEPS,
  INIT_MANUAL_FINALIZE_STEPS_COMPLETED,
} from "../demo-control-types";
import {
  runLuminaforgeAppContextTraining,
  runLuminaforgeBenignBootstrap,
  withLuminaforgeConnection,
} from "./luminaforge-session";
import { withConnection } from "./pool";

export type { DemoAction, DemoScope } from "../demo-control-types";

const SCOPE_ACTIONS: Record<DemoScope, DemoAction[]> = {
  global: ["firewall-disable", "firewall-enable", "purge-violations", "view-violations"],
  aegis: ["purge-violations", "view-violations"],
  luminaforge: [
    "block-on",
    "block-off",
    "capture-on",
    "capture-off",
    "generate-allow-list",
    "sql-monitor-enable",
    "sql-monitor-disable",
    "purge-violations",
    "clear-firewall-policy",
    "init-default-policy",
    "view-violations",
    "view-sql-monitor",
    "view-capture-status",
  ],
};

const USER_BY_SCOPE: Record<Exclude<DemoScope, "global">, string> = {
  aegis: "AEGIS_APP",
  luminaforge: "LUMINAFORGE",
};

export function isValidDemoRequest(
  scope: string,
  action: string,
): scope is DemoScope {
  if (!(scope in SCOPE_ACTIONS)) return false;
  return SCOPE_ACTIONS[scope as DemoScope].includes(action as DemoAction);
}

export function isMutatingAction(action: DemoAction): boolean {
  return !action.startsWith("view-");
}

function sqlForAction(scope: DemoScope, action: DemoAction): string {
  const user =
    scope === "global" ? null : USER_BY_SCOPE[scope as Exclude<DemoScope, "global">];

  switch (action) {
    case "firewall-disable":
      return "BEGIN SYS.aegis_demo_control.firewall_disable(:msg); END;";
    case "firewall-enable":
      return "BEGIN SYS.aegis_demo_control.firewall_enable(:msg); END;";
    case "block-on":
      return `BEGIN SYS.aegis_demo_control.set_sql_block('${user}', TRUE, :msg); END;`;
    case "block-off":
      return `BEGIN SYS.aegis_demo_control.set_sql_block('${user}', FALSE, :msg); END;`;
    case "capture-on":
      return `BEGIN SYS.aegis_demo_control.set_capture('${user}', TRUE, :msg); END;`;
    case "capture-off":
      return `BEGIN SYS.aegis_demo_control.set_capture('${user}', FALSE, :msg); END;`;
    case "generate-allow-list":
      return `BEGIN SYS.aegis_demo_control.generate_allow_list('${user}', :msg); END;`;
    case "sql-monitor-enable":
      return `BEGIN SYS.aegis_demo_control.set_sql_monitor('${user}', TRUE, :msg); END;`;
    case "sql-monitor-disable":
      return `BEGIN SYS.aegis_demo_control.set_sql_monitor('${user}', FALSE, :msg); END;`;
    case "purge-violations":
      if (scope === "global") {
        return "BEGIN SYS.aegis_demo_control.purge_violations(NULL, :msg); END;";
      }
      return `BEGIN SYS.aegis_demo_control.purge_violations('${user}', :msg); END;`;
    case "clear-firewall-policy":
      return `BEGIN SYS.aegis_demo_control.clear_firewall_policy('${user}', :msg); END;`;
    case "init-default-policy":
      return [
        "BEGIN SYS.aegis_demo_control.clear_firewall_policy('luminaforge', :msg); END;",
        "BEGIN SYS.aegis_demo_control.init_default_demo_policy('luminaforge', :msg); END;",
        "-- benign SQL + LuminaForge HTTP (steps 1–4); manual: Stop capture → Generate Allow List",
      ].join("\n");
    case "view-violations":
      if (scope === "global") {
        return "BEGIN SYS.aegis_demo_control.view_violations(NULL, :cur); END;";
      }
      return `BEGIN SYS.aegis_demo_control.view_violations('${user}', :cur); END;`;
    case "view-sql-monitor":
      return `BEGIN SYS.aegis_demo_control.view_allow_list('${user}', :cur); END;`;
    case "view-capture-status":
      return `BEGIN SYS.aegis_demo_control.view_capture_status('${user}', :cur); END;`;
    default:
      return "";
  }
}

function displaySql(scope: DemoScope, action: DemoAction): string {
  const user =
    scope === "global" ? null : USER_BY_SCOPE[scope as Exclude<DemoScope, "global">];

  switch (action) {
    case "firewall-disable":
      return "BEGIN SYS.aegis_demo_control.firewall_disable(:msg); END;";
    case "firewall-enable":
      return "BEGIN SYS.aegis_demo_control.firewall_enable(:msg); END;";
    case "block-on":
      return `BEGIN SYS.aegis_demo_control.set_sql_block('${user}', TRUE, :msg); END;`;
    case "block-off":
      return `BEGIN SYS.aegis_demo_control.set_sql_block('${user}', FALSE, :msg); END;`;
    case "capture-on":
      return `EXEC SYS.DBMS_SQL_FIREWALL.START_CAPTURE('${user}');\n-- or CREATE_CAPTURE if no row exists`;
    case "capture-off":
      return `EXEC SYS.DBMS_SQL_FIREWALL.STOP_CAPTURE('${user}');`;
    case "generate-allow-list":
      return `EXEC SYS.DBMS_SQL_FIREWALL.GENERATE_ALLOW_LIST('${user}');\n-- then enable allow-list in log-only mode\nEXEC SYS.DBMS_SQL_FIREWALL.ENABLE_ALLOW_LIST('${user}', enforce => ENFORCE_ALL, block => FALSE);`;
    case "sql-monitor-enable":
      return `BEGIN SYS.aegis_demo_control.set_sql_monitor('${user}', TRUE, :msg); END;`;
    case "sql-monitor-disable":
      return `BEGIN SYS.aegis_demo_control.set_sql_monitor('${user}', FALSE, :msg); END;`;
    case "purge-violations":
      if (scope === "global") {
        return `-- Purge violation logs for luminaforge + AEGIS_APP\nEXEC SYS.DBMS_SQL_FIREWALL.PURGE_LOG(...);\nEXEC SYS.DBMS_SQL_FIREWALL.FLUSH_LOGS;`;
      }
      return `EXEC SYS.DBMS_SQL_FIREWALL.PURGE_LOG('${user}', ... VIOLATION_LOG);\nEXEC SYS.DBMS_SQL_FIREWALL.FLUSH_LOGS;`;
    case "clear-firewall-policy":
      return `-- Drop allow-list + capture for ${user}\nBEGIN SYS.aegis_demo_control.clear_firewall_policy('${user}', :msg); END;`;
    case "init-default-policy":
      return [
        "-- 1. Clear policy + start capture (AEGIS_APP → SYS.aegis_demo_control)",
        "BEGIN SYS.aegis_demo_control.clear_firewall_policy('luminaforge', :msg); END;",
        "BEGIN SYS.aegis_demo_control.init_default_demo_policy('luminaforge', :msg); END;",
        "-- 2. Benign SQL as luminaforge + LuminaForge HTTP /api/session,/api/portfolio",
        "-- 3. (Manual) Stop SQL capture → Generate Allow List — not run by init",
      ].join("\n");
    case "view-violations":
      if (scope === "global") {
        return `-- Via SYS.aegis_demo_control (definer)\nSELECT ... FROM dba_sql_firewall_violations\nWHERE username IN ('AEGIS_APP','LUMINAFORGE') FETCH FIRST 20 ROWS`;
      }
      return `-- Via SYS.aegis_demo_control (definer)\nSELECT ... FROM dba_sql_firewall_violations\nWHERE username = '${user}' FETCH FIRST 20 ROWS`;
    case "view-sql-monitor":
      return `-- Via SYS.aegis_demo_control (definer)\nSELECT ... FROM dba_sql_firewall_allow_lists\nWHERE username = '${user}'`;
    case "view-capture-status":
      return `-- Via SYS.aegis_demo_control (definer)\nSELECT ... FROM dba_sql_firewall_captures\nWHERE username = '${user}'`;
    default:
      return "";
  }
}

async function fetchViewCursor(
  connection: Connection,
  plsql: string,
): Promise<Record<string, unknown>[]> {
  const result = await connection.execute(plsql, {
    cur: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
  });
  const out = result.outBinds as {
    cur?: import("oracledb").ResultSet<Record<string, unknown>>;
  };
  const rs = out?.cur;
  if (!rs) return [];
  try {
    const rows = await rs.getRows(50);
    return rows as Record<string, unknown>[];
  } finally {
    await rs.close();
  }
}

async function callPackage(
  connection: Connection,
  plsql: string,
): Promise<string> {
  const result = await connection.execute(plsql, {
    msg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 4000 },
  });
  const out = result.outBinds as { msg?: string | string[] } | undefined;
  const msg = out?.msg;
  if (Array.isArray(msg)) return msg[0] ?? "OK";
  return msg ?? "OK";
}

function formatRows(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "(no rows)";
  return rows
    .map((row, i) => {
      const parts = Object.entries(row).map(([k, v]) => `${k}=${v}`);
      return `${i + 1}. ${parts.join(" | ")}`;
    })
    .join("\n");
}

import type { DashboardMetrics, MonitoredAppStatus } from "../types";

export interface DemoExecuteResult {
  sql: string;
  output: string;
  ok: boolean;
  mutating: boolean;
  /** Set after global firewall on/off succeeds */
  firewallGloballyEnabled?: boolean;
  /** Fresh Monitored Apps + metrics after mutating actions */
  apps?: MonitoredAppStatus[];
  metrics?: DashboardMetrics;
  /** Present when init-default-policy leaves capture running for manual finalize */
  initManualFinalize?: InitManualFinalizeGuide;
}

async function executeInitDefaultPolicy(): Promise<DemoExecuteResult> {
  const sql = displaySql("luminaforge", "init-default-policy");
  const lines: string[] = [];

  try {
    await withConnection(async (connection) => {
      lines.push(
        await callPackage(
          connection,
          "BEGIN SYS.aegis_demo_control.clear_firewall_policy('luminaforge', :msg); END;",
        ),
      );
      lines.push(
        await callPackage(
          connection,
          "BEGIN SYS.aegis_demo_control.init_default_demo_policy('luminaforge', :msg); END;",
        ),
      );
    });

    await withLuminaforgeConnection(async (connection) => {
      await runLuminaforgeBenignBootstrap(connection);
      lines.push("Benign SQL executed as luminaforge (capture training).");
    });

    lines.push(...(await runLuminaforgeAppContextTraining()));

    lines.push(
      "Capture is ON. Finish manually: browse LuminaForge → Stop SQL capture → Generate Allow List.",
    );

    await withConnection(async (connection) => {
      await connection.execute(`BEGIN SYS.aegis_fw_flush_logs; END;`).catch(() =>
        connection.execute(`BEGIN SYS.DBMS_SQL_FIREWALL.FLUSH_LOGS; END;`),
      );
    });

    return {
      sql,
      output: lines.join("\n"),
      ok: true,
      mutating: true,
      initManualFinalize: {
        captureActive: true,
        stepsCompleted: [...INIT_MANUAL_FINALIZE_STEPS_COMPLETED],
        nextSteps: [...INIT_MANUAL_FINALIZE_NEXT_STEPS],
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      sql,
      output: message,
      ok: false,
      mutating: true,
    };
  }
}

export async function executeDemoAction(
  scope: DemoScope,
  action: DemoAction,
): Promise<DemoExecuteResult> {
  if (action === "init-default-policy") {
    return executeInitDefaultPolicy();
  }

  const sql = displaySql(scope, action);
  const plsql = sqlForAction(scope, action);

  try {
    return await withConnection(async (connection) => {
      if (action.startsWith("view-")) {
        await connection.execute(`BEGIN SYS.aegis_fw_flush_logs; END;`).catch(() => {
          return connection.execute(`BEGIN SYS.DBMS_SQL_FIREWALL.FLUSH_LOGS; END;`);
        });
        const rows = await fetchViewCursor(connection, plsql);
        return {
          sql,
          output: `Rows: ${rows.length}\n${formatRows(rows)}`,
          ok: true,
          mutating: false,
        };
      }

      const msg = await callPackage(connection, plsql);
      await connection.execute(`BEGIN SYS.aegis_fw_flush_logs; END;`).catch(() =>
        connection.execute(`BEGIN SYS.DBMS_SQL_FIREWALL.FLUSH_LOGS; END;`),
      );

      const result: DemoExecuteResult = {
        sql,
        output: msg,
        ok: true,
        mutating: true,
      };
      if (action === "firewall-disable") {
        result.firewallGloballyEnabled = false;
      } else if (action === "firewall-enable") {
        result.firewallGloballyEnabled = true;
      }

      return result;
    });
  } catch (err) {
    let message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("AEGIS_DEMO_CONTROL") &&
      message.includes("PLS-00201")
    ) {
      message +=
        "\n\nDemo Control package not installed. As SYS AS SYSDBA run:\n" +
        "  ALTER SESSION SET CONTAINER = AHDB2605_PDB1;\n" +
        "  @Oracle_DB_Demo_Control_Grant.sql\n" +
        "(from repo root on demodb26ai or via SQL Developer SYS connection)";
    } else if (message.includes("ORA-47605")) {
      message +=
        "\n\nSQL Firewall blocked the AEGIS_APP session (SQL Monitor is ENABLED on the SOC user). " +
        "As SYS AS SYSDBA run: @Oracle_DB_Repair_AEGIS_SOC.sql " +
        "(or re-run @Oracle_DB_Demo_Control_Grant.sql). " +
        "Do not use Block attacks on the Aegis Vault column — only LuminaForge.";
    } else if (
      message.includes("view_") &&
      message.includes("PLS-00302") &&
      message.includes("AEGIS_DEMO_CONTROL")
    ) {
      message +=
        "\n\nPackage is outdated (need v2.8.1+ for default demo policy). " +
        "Re-run @Oracle_DB_Demo_Control_Grant.sql as SYS AS SYSDBA.";
    }
    return {
      sql,
      output: message,
      ok: false,
      mutating: isMutatingAction(action),
    };
  }
}
