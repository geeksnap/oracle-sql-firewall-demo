import oracledb, { type Connection, type Pool } from "oracledb";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

let pool: Pool | null = null;

export function getDbConfig() {
  const user = process.env.DB_USER ?? "AEGIS_APP";
  const password = process.env.DB_PASSWORD;
  const connectString = process.env.DB_CONNECTION_STRING;

  if (!password || !connectString) {
    throw new Error(
      "Missing DB_PASSWORD or DB_CONNECTION_STRING in aegis-vault/.env",
    );
  }

  return { user, password, connectString };
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  const { user, password, connectString } = getDbConfig();

  pool = await oracledb.createPool({
    user,
    password,
    connectString,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  });

  return pool;
}

export async function withConnection<T>(
  fn: (connection: Connection) => Promise<T>,
): Promise<T> {
  const activePool = await getPool();
  let connection: Connection | undefined;

  try {
    connection = await activePool.getConnection();
    return await fn(connection);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("[aegis-vault] connection.close() failed:", closeErr);
      }
    }
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(10);
    pool = null;
  }
}

export function mapUsernameToSourceApp(
  username: string,
): "AEGIS_APP" | "luminaforge" {
  const normalized = username.toUpperCase();
  if (normalized === "LUMINAFORGE") return "luminaforge";
  return "AEGIS_APP";
}
