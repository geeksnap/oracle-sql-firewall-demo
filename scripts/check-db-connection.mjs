#!/usr/bin/env node
/**
 * Quick Oracle connectivity probe for start.sh / manual checks.
 * Reads aegis-vault/.env (or env vars already set).
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(repoRoot, "aegis-vault", ".env");

function loadEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = loadEnvFile(envPath);
const user = process.env.DB_USER ?? fileEnv.DB_USER ?? "AEGIS_APP";
const password = process.env.DB_PASSWORD ?? fileEnv.DB_PASSWORD;
const connectString =
  process.env.DB_CONNECTION_STRING ?? fileEnv.DB_CONNECTION_STRING;

if (!password || !connectString) {
  console.error(
    "Missing DB credentials. Copy aegis-vault/.env.example → aegis-vault/.env",
  );
  process.exit(1);
}

const require = createRequire(import.meta.url);
const oracledb = require(join(repoRoot, "aegis-vault", "node_modules", "oracledb"));

const libDir = process.env.ORACLE_CLIENT_LIBDIR;
if (libDir) {
  try {
    oracledb.initOracleClient({ libDir });
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes("already")) throw e;
  }
}

let connection;
try {
  connection = await oracledb.getConnection({ user, password, connectString });
  const r = await connection.execute("SELECT 1 AS ok FROM dual");
  const ok = r.rows?.[0]?.OK ?? r.rows?.[0]?.[0];
  if (ok !== 1) throw new Error("Unexpected probe result");
  console.log(`OK: connected as ${user} @ ${connectString}`);
} catch (err) {
  console.error(`FAIL: ${err.message ?? err}`);
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
