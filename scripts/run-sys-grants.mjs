#!/usr/bin/env node
/**
 * Run SYS grant scripts (flush + demo control) via oracledb Thin Mode.
 * Requires: DB_SYS_PASSWORD in environment (SYS password for the PDB).
 *
 *   DB_SYS_PASSWORD='your-sys-password' node scripts/run-sys-grants.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(
  join(dirname(fileURLToPath(import.meta.url)), "../aegis-vault/package.json"),
);
const oracledb = require("oracledb");

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const connectString = process.env.DB_CONNECTION_STRING;

const scripts = [
  "Oracle_DB_Aegis_Flush_Grant.sql",
  "Oracle_DB_Demo_Control_Grant.sql",
];

function splitSqlBlocks(sql) {
  const lines = sql.split(/\r?\n/);
  const blocks = [];
  let buf = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") || trimmed.toUpperCase().startsWith("PROMPT ")) {
      continue;
    }
    if (trimmed === "/") {
      if (buf.length) blocks.push(buf.join("\n").trim());
      buf = [];
      continue;
    }
    buf.push(line);
  }
  if (buf.length) {
    const tail = buf.join("\n").trim();
    if (tail) blocks.push(tail);
  }
  return blocks.filter(Boolean);
}

async function main() {
  const password = process.env.DB_SYS_PASSWORD;
  if (!password) {
    console.error(
      "Set DB_SYS_PASSWORD to the SYS password, then re-run.\n" +
        "  DB_SYS_PASSWORD='...' node scripts/run-sys-grants.mjs",
    );
    process.exit(1);
  }
  if (!connectString) {
    console.error(
      "Set DB_CONNECTION_STRING to the PDB connect descriptor, then re-run.\n" +
        "  DB_CONNECTION_STRING='host:1521/service' DB_SYS_PASSWORD='...' node scripts/run-sys-grants.mjs",
    );
    process.exit(1);
  }

  let connection;
  try {
    connection = await oracledb.getConnection({
      user: "sys",
      password,
      connectString,
      privilege: oracledb.SYSDBA,
    });

    for (const file of scripts) {
      const path = join(repoRoot, file);
      console.log(`\n=== ${file} ===`);
      const sql = readFileSync(path, "utf8");
      for (const block of splitSqlBlocks(sql)) {
        await connection.execute(block);
        console.log("OK:", block.split("\n")[0].slice(0, 72));
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
    console.log("\n=== Verify ===");
    for (const row of verify.rows ?? []) {
      console.log(row);
    }
    console.log("\n[SUCCESS] SYS grants installed.");
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
