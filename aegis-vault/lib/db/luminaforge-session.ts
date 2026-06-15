import oracledb, { type Connection, type Pool } from "oracledb";
import { getDbConfig } from "./pool";

const BENIGN_BOOTSTRAP_SQL = [
  "SELECT COUNT(*) FROM portfolio WHERE user_id = 1",
  "SELECT COUNT(*) FROM portfolio WHERE UPPER(symbol) LIKE '%ORCL%'",
  "SELECT COUNT(*) FROM transactions WHERE user_id = 1",
  "SELECT COUNT(*) FROM luxury_items WHERE category = 'watch'",
  "SELECT COUNT(*) FROM users WHERE username = 'demo_user'",
  "SELECT username, role FROM users WHERE id = 1",
  "SELECT 1 FROM dual",
] as const;

const LUMINAFORGE_HTTP_TRAINING_PATHS = ["/api/session", "/api/portfolio"] as const;
const LUMINAFORGE_HTTP_TIMEOUT_MS = 15_000;

let luminaforgePool: Pool | null = null;

export function getLuminaforgeBaseUrl(): string {
  const raw = process.env.LUMINAFORGE_BASE_URL?.trim() || "http://localhost:3001";
  return raw.replace(/\/$/, "");
}

async function getLuminaforgePool(): Promise<Pool> {
  if (luminaforgePool) return luminaforgePool;

  const { password, connectString } = getDbConfig();
  luminaforgePool = await oracledb.createPool({
    user: "luminaforge",
    password,
    connectString,
    poolMin: 0,
    poolMax: 2,
    poolIncrement: 1,
  });

  return luminaforgePool;
}

/** Run benign training SQL in a luminaforge session (required for SQL Firewall capture). */
export async function runLuminaforgeBenignBootstrap(
  connection: Connection,
): Promise<void> {
  try {
    await connection.execute(
      "BEGIN luminaforge.aegis_demo_bootstrap_benign; END;",
    );
    return;
  } catch {
    /* procedure missing or outdated — run inline */
  }

  for (const sql of BENIGN_BOOTSTRAP_SQL) {
    await connection.execute(sql);
  }
}

/**
 * Hit LuminaForge HTTP routes while SQL capture is on so allow-list training
 * includes session context from the LuminaForge Node server (not only Aegis).
 */
export async function runLuminaforgeAppContextTraining(): Promise<string[]> {
  const base = getLuminaforgeBaseUrl();
  const lines: string[] = [];

  for (const path of LUMINAFORGE_HTTP_TRAINING_PATHS) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(LUMINAFORGE_HTTP_TIMEOUT_MS),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      await res.json().catch(() => null);
      lines.push(`LuminaForge app context captured via ${path} (${base})`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      const cause =
        err instanceof Error && err.cause instanceof Error
          ? err.cause.message
          : "";
      throw new Error(
        `Cannot reach LuminaForge at ${url}${cause ? ` (${cause})` : ""}: ${detail}\n\n` +
          "Start LuminaForge (npm run dev on port 3001), then re-run Initialize default demo policy.",
      );
    }
  }

  return lines;
}

export async function withLuminaforgeConnection<T>(
  fn: (connection: Connection) => Promise<T>,
): Promise<T> {
  const pool = await getLuminaforgePool();
  let connection: Connection | undefined;

  try {
    connection = await pool.getConnection();
    return await fn(connection);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("[aegis-vault] luminaforge connection.close() failed:", closeErr);
      }
    }
  }
}
