#!/usr/bin/env node
/**
 * Bootstrap Aegis Vault + LuminaForge schema on OCI Base DB (Thin Mode, SYS AS SYSDBA).
 *
 * Required environment:
 *   DB_CONNECT_STRING  — host:1521/service  (PDB service)
 *   DB_SYS_PASSWORD    — SYS password
 *   DB_PDB_NAME        — PDB name, e.g. SQLFWPDB1
 *   APP_DB_PASSWORD    — password for AEGIS_APP + luminaforge users
 *
 * Optional:
 *   REPO_ROOT          — default: parent of scripts/
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(
  join(dirname(fileURLToPath(import.meta.url)), "../aegis-vault/package.json"),
);
const oracledb = require("oracledb");

const clientLibDir =
  process.env.ORACLE_CLIENT_LIBDIR ?? "/usr/lib/oracle/19.31/client64/lib";
try {
  oracledb.initOracleClient({ libDir: clientLibDir });
} catch (e) {
  const msg = String(e.message ?? e);
  if (!msg.includes("already")) throw e;
}

const repoRoot = process.env.REPO_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), "..");
const REF_PDB = "AHDB2605_PDB1";
const REF_APP_PW = "OracleFWDemo-123#";

const scripts = [
  "Oracle_DB_Setup.sql",
  "Oracle_DB_Aegis_Flush_Grant.sql",
  "Oracle_DB_Demo_Control_Grant.sql",
];

function isSqlPlusDirective(line) {
  return /^(SET|PROMPT|WHENEVER|SPOOL|EXIT|QUIT|CONNECT|DISCONNECT)\s/i.test(line);
}

function stripInlineComment(line) {
  return line.replace(/\s*--.*$/, "").trimEnd();
}

function splitSimpleStatements(chunk) {
  const blocks = [];
  let stmt = "";
  let inPlsql = false;

  for (const line of chunk.split("\n")) {
    const trimmed = stripInlineComment(line).trim();

    if (
      !inPlsql &&
      (/^BEGIN\s*$/i.test(trimmed) || /^DECLARE\b/i.test(trimmed)) &&
      !/CREATE OR REPLACE/i.test(stmt)
    ) {
      const pending = stmt.trim().replace(/;\s*$/, "");
      if (pending) {
        if (/^EXEC\s+/i.test(pending)) {
          const call = pending.replace(/^EXEC\s+/i, "").replace(/;\s*$/, "");
          blocks.push(`BEGIN ${call}; END;`);
        } else {
          blocks.push(pending);
        }
      }
      stmt = line;
      inPlsql = true;
      continue;
    }

    stmt += (stmt ? "\n" : "") + line;

    if (inPlsql) {
      if (/^END;\s*$/i.test(trimmed)) {
        blocks.push(stmt.trim());
        stmt = "";
        inPlsql = false;
      }
      continue;
    }

    if (trimmed.endsWith(";")) {
      const s = stmt.trim().replace(/;\s*$/, "");
      if (/^EXEC\s+/i.test(s)) {
        const call = s.replace(/^EXEC\s+/i, "").replace(/;\s*$/, "");
        blocks.push(`BEGIN ${call}; END;`);
      } else if (s) {
        blocks.push(s);
      }
      stmt = "";
    }
  }

  const tail = stmt.trim().replace(/;\s*$/, "");
  if (tail) {
    if (/^EXEC\s+/i.test(tail)) {
      const call = tail.replace(/^EXEC\s+/i, "").replace(/;\s*$/, "");
      blocks.push(`BEGIN ${call}; END;`);
    } else {
      blocks.push(tail);
    }
  }
  return blocks;
}

function splitSqlBlocks(sql) {
  const lines = [];
  for (const line of sql.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("--") || isSqlPlusDirective(trimmed)) continue;
    if (trimmed.startsWith("@@")) continue;
    lines.push(stripInlineComment(line));
  }

  const blocks = [];
  let buf = [];

  const flushBuf = () => {
    const chunk = buf.join("\n").trim();
    buf = [];
    if (!chunk) return;
    if (/^EXEC\s+/i.test(chunk)) {
      const call = chunk.replace(/^EXEC\s+/i, "").replace(/;\s*$/, "");
      blocks.push(`BEGIN ${call}; END;`);
      return;
    }
    if (/CREATE OR REPLACE/i.test(chunk)) {
      const parts = chunk.split(/(?=CREATE OR REPLACE)/i);
      for (const part of parts) {
        const p = part.trim();
        if (!p) continue;
        if (/^CREATE OR REPLACE/i.test(p)) {
          blocks.push(p);
        } else {
          blocks.push(...splitSimpleStatements(p));
        }
      }
      return;
    }
    if (/^(DECLARE|BEGIN)\b/i.test(chunk)) {
      blocks.push(chunk);
      return;
    }
    blocks.push(...splitSimpleStatements(chunk));
  };

  for (const line of lines) {
    if (line.trim() === "/") {
      flushBuf();
      continue;
    }
    buf.push(line);
  }
  flushBuf();
  return blocks.filter(Boolean);
}

function prepareSql(content, pdbName, appPassword) {
  return content
    .replaceAll(REF_PDB, pdbName)
    .replaceAll(REF_APP_PW, appPassword);
}

function quoteOraclePassword(pw) {
  return `"${String(pw).replace(/"/g, '""')}"`;
}

function blockFirstLine(block) {
  return block.split("\n")[0].slice(0, 72);
}

/** Idempotent re-run: skip or repair statements that already applied on a prior bootstrap. */
async function handleBootstrapError(connection, err, block, appPassword) {
  const firstLine = blockFirstLine(block);
  const n = err?.errorNum;

  if (n === 1749) {
    console.log("SKIP:", firstLine, "(ORA-01749)");
    return true;
  }
  if (n === 47630) {
    console.log("SKIP:", firstLine, "(ORA-47630 — no allow-list yet)");
    return true;
  }
  if (n === 1920 && /^CREATE\s+USER\s+/i.test(block)) {
    const userMatch = block.match(/^CREATE\s+USER\s+(\S+)/i);
    if (userMatch) {
      const user = userMatch[1];
      try {
        await connection.execute(
          `ALTER USER ${user} IDENTIFIED BY ${quoteOraclePassword(appPassword)}`,
          [],
          { autoCommit: true },
        );
        console.log("SKIP+ALTER:", user, "(ORA-01920 — user exists, password synced)");
      } catch (alterErr) {
        if (alterErr?.errorNum === 28007) {
          console.log("SKIP:", user, "(ORA-01920 — user exists, password already current)");
        } else {
          throw alterErr;
        }
      }
      return true;
    }
  }
  if (n === 955 && /^CREATE\s+/i.test(block)) {
    console.log("SKIP:", firstLine, "(ORA-00955 — object exists)");
    return true;
  }
  if (n === 1 && /^INSERT\s+/i.test(block)) {
    console.log("SKIP:", firstLine, "(ORA-00001 — duplicate seed row)");
    return true;
  }
  if (/CREATE_CAPTURE/i.test(block) && (n === 47601 || n === 47624)) {
    console.log("SKIP:", firstLine, `(ORA-${n} — capture already exists)`);
    return true;
  }
  if (n === 900 && /^\s*SELECT\b/i.test(block)) {
    console.log("SKIP: verify SELECT");
    return true;
  }
  return false;
}

async function main() {
  const connectString = process.env.DB_CONNECT_STRING;
  const sysPassword = process.env.DB_SYS_PASSWORD;
  const pdbName = process.env.DB_PDB_NAME;
  const appPassword = process.env.APP_DB_PASSWORD;

  for (const [k, v] of Object.entries({
    DB_CONNECT_STRING: connectString,
    DB_SYS_PASSWORD: sysPassword,
    DB_PDB_NAME: pdbName,
    APP_DB_PASSWORD: appPassword,
  })) {
    if (!v) {
      console.error(`Missing required env: ${k}`);
      process.exit(1);
    }
  }

  let connection;
  try {
    console.log(`Connecting SYS AS SYSDBA → ${connectString}`);
    connection = await oracledb.getConnection({
      user: "sys",
      password: sysPassword,
      connectString,
      privilege: oracledb.SYSDBA,
    });

    for (const file of scripts) {
      const path = join(repoRoot, file);
      console.log(`\n=== ${file} ===`);
      let sql = readFileSync(path, "utf8");
      sql = prepareSql(sql, pdbName, appPassword);

      if (file === "Oracle_DB_Demo_Control_Grant.sql") {
        const bootstrapPath = join(repoRoot, "sql/luminaforge_bootstrap_benign.sql");
        const bootstrapSql = prepareSql(readFileSync(bootstrapPath, "utf8"), pdbName, appPassword);
        sql = sql.replace("@@sql/luminaforge_bootstrap_benign.sql", bootstrapSql);
      }

      for (const block of splitSqlBlocks(sql)) {
        try {
          await connection.execute(block, [], { autoCommit: true });
          console.log("OK:", block.split("\n")[0].slice(0, 72));
        } catch (err) {
          if (await handleBootstrapError(connection, err, block, appPassword)) {
            continue;
          }
          throw err;
        }
      }
    }

    const verify = await connection.execute(
      `SELECT object_name, object_type, status
       FROM dba_objects
       WHERE owner = 'SYS'
         AND object_name IN ('AEGIS_DEMO_CONTROL', 'AEGIS_FW_FLUSH_LOGS')
       ORDER BY object_name, object_type`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    console.log("\n=== Verify packages ===");
    for (const row of verify.rows ?? []) {
      console.log(row);
    }

    const users = await connection.execute(
      `SELECT COUNT(*) AS cnt FROM dba_users WHERE username IN ('AEGIS_APP','LUMINAFORGE')`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    console.log("Demo users:", users.rows?.[0]);

    console.log("\n[SUCCESS] Database bootstrap complete for PDB", pdbName);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch {
        /* ignore */
      }
    }
  }
}

main();
