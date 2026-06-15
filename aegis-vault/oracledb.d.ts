declare module "oracledb" {
  export interface Pool {
    getConnection(): Promise<Connection>;
    close(drainTime?: number): Promise<void>;
  }

  export interface ResultSet<T = unknown> {
    getRows(numRows: number): Promise<T[]>;
    close(): Promise<void>;
  }

  export interface Connection {
    execute<T = unknown>(
      sql: string,
      binds?: Record<string, unknown>,
      options?: Record<string, unknown>,
    ): Promise<{ rows?: T[]; outBinds?: Record<string, unknown> }>;
    close(): Promise<void>;
  }

  const oracledb: {
    OUT_FORMAT_OBJECT: number;
    BIND_OUT: number;
    CURSOR: number;
    STRING: number;
    CLOB: number;
    outFormat: number;
    fetchAsString: number[];
    createPool(config: Record<string, unknown>): Promise<Pool>;
    initOracleClient(options?: { libDir?: string }): void;
  };
  export default oracledb;
}
