import oracledb, {
  type Connection,
  type Pool,
} from "oracledb";
import {
  getDemoSeedConfig,
  type DemoSeedEnvironment,
} from "../demo-seed-config";
import { getPool } from "./pool";

export interface DemoSeedCounts {
  users: number;
  portfolio: number;
  transactions: number;
  luxuryItems: number;
}

export interface DemoSeedResult {
  ok: boolean;
  anchor?: string;
  counts?: DemoSeedCounts;
  error?: string;
  rolledBack: boolean;
}

export interface DemoSeedDependencies {
  pool?: Pick<Pool, "getConnection">;
  env?: DemoSeedEnvironment;
}

const INITIALIZE_SQL = `BEGIN
  SYS.aegis_demo_control.initialize_demo_seed_data(
    :anchor, :users, :portfolio, :transactions, :luxury_items
  );
END;`;

function safeOracleError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const oracleCode = raw.match(/\b(?:ORA|PLS)-\d{4,5}\b/)?.[0];
  if (raw.includes("already running")) {
    return "Demo seed initialization is already running";
  }
  if (raw.includes("validation failed")) {
    return `Demo seed validation failed${oracleCode ? ` (${oracleCode})` : ""}`;
  }
  return `Demo seed initialization failed${oracleCode ? ` (${oracleCode})` : ""}`;
}

function numberBind(): Record<string, unknown> {
  return { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };
}

export async function executeDemoSeedInitialization(
  dependencies: DemoSeedDependencies = {},
): Promise<DemoSeedResult> {
  getDemoSeedConfig(dependencies.env);
  const activePool = dependencies.pool ?? (await getPool());
  let connection: Connection | undefined;
  let rolledBack = false;

  try {
    connection = await activePool.getConnection();
    await connection.execute(`ALTER SESSION SET TIME_ZONE = '+00:00'`);
    const result = await connection.execute(INITIALIZE_SQL, {
      anchor: {
        dir: oracledb.BIND_OUT,
        type: oracledb.STRING,
        maxSize: 64,
      },
      users: numberBind(),
      portfolio: numberBind(),
      transactions: numberBind(),
      luxury_items: numberBind(),
    });
    const out = result.outBinds as
      | {
          anchor?: string;
          users?: number;
          portfolio?: number;
          transactions?: number;
          luxury_items?: number;
        }
      | undefined;
    const anchor = out?.anchor;
    const counts = {
      users: Number(out?.users),
      portfolio: Number(out?.portfolio),
      transactions: Number(out?.transactions),
      luxuryItems: Number(out?.luxury_items),
    };
    if (
      !anchor ||
      !Object.values(counts).every(
        (count) => Number.isInteger(count) && count >= 0,
      )
    ) {
      throw new Error("Demo seed validation failed: invalid package output");
    }
    await connection.commit();
    return { ok: true, anchor, counts, rolledBack: false };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        rolledBack = true;
      } catch {
        rolledBack = false;
      }
    }
    return {
      ok: false,
      error: safeOracleError(error),
      rolledBack,
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error(
          "[aegis-vault] demo seed connection.close() failed:",
          closeError instanceof Error ? closeError.message : "unknown close error",
        );
      }
    }
  }
}
