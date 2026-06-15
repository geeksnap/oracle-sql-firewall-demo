// Minimal type shim for oracledb thin-mode usage in LuminaForge.
// Covers exactly the surface used by pool.ts and query modules.
declare module "oracledb" {
  interface PoolAttributes {
    user: string;
    password: string;
    connectString: string;
    poolMin?: number;
    poolMax?: number;
    poolIncrement?: number;
    poolTimeout?: number;
  }

  interface ExecuteOptions {
    outFormat?: number;
  }

  interface Result<T> {
    rows?: T[];
    outBinds?: Record<string, unknown>;
  }

  interface ResultSet<T> {
    getRows(num: number): Promise<T[]>;
    close(): Promise<void>;
  }

  interface Connection {
    execute<T = Record<string, unknown>>(
      sql: string,
      bindParams?: Record<string, unknown> | unknown[],
      options?: ExecuteOptions,
    ): Promise<Result<T>>;
    commit(): Promise<void>;
    close(): Promise<void>;
  }

  interface Pool {
    getConnection(): Promise<Connection>;
    close(drainTime?: number): Promise<void>;
  }

  const OUT_FORMAT_OBJECT: number;
  const CLOB: number;
  const CURSOR: number;
  const BIND_OUT: number;

  let outFormat: number;
  let fetchAsString: number[];
  let poolPingInterval: number;

  function createPool(attrs: PoolAttributes): Promise<Pool>;
  function initOracleClient(options?: { libDir?: string }): void;

  export {
    OUT_FORMAT_OBJECT,
    CLOB,
    CURSOR,
    BIND_OUT,
    outFormat,
    fetchAsString,
    createPool,
    initOracleClient,
    Connection,
    Pool,
    ResultSet,
    Result,
  };

  const oracledb: {
    OUT_FORMAT_OBJECT: number;
    CLOB: number;
    CURSOR: number;
    BIND_OUT: number;
    outFormat: number;
    fetchAsString: number[];
    poolPingInterval: number;
    createPool(attrs: PoolAttributes): Promise<Pool>;
    initOracleClient(options?: { libDir?: string }): void;
  };

  export default oracledb;
}
