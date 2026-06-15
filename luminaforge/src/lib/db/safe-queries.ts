import { withConnection } from "./pool";

export interface TransactionRow {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  asset: string | null;
  timestamp: string;
}

export interface PortfolioRow {
  id: number;
  user_id: number;
  symbol: string;
  quantity: number;
  avg_price: number;
}

export async function fetchPortfolio(userId: number): Promise<PortfolioRow[]> {
  return withConnection(async (conn) => {
    const result = await conn.execute<Record<string, unknown>>(
      `SELECT id, user_id, symbol, quantity, avg_price
       FROM portfolio
       WHERE user_id = :userId
       ORDER BY symbol`,
      { userId },
    );
    return (result.rows ?? []).map((r: Record<string, unknown>) => ({
      id: Number(r.ID ?? r.id),
      user_id: Number(r.USER_ID ?? r.user_id),
      symbol: String(r.SYMBOL ?? r.symbol),
      quantity: Number(r.QUANTITY ?? r.quantity),
      avg_price: Number(r.AVG_PRICE ?? r.avg_price),
    }));
  });
}

export const DEMO_USER_ID = 1;

export interface SessionUser {
  username: string;
  role: string;
}

export async function fetchDemoSessionUser(
  userId = DEMO_USER_ID,
): Promise<SessionUser | null> {
  return withConnection(async (conn) => {
    const result = await conn.execute<Record<string, unknown>>(
      `SELECT username, role
       FROM users
       WHERE id = :userId`,
      { userId },
    );
    const row = result.rows?.[0];
    if (!row) return null;
    return {
      username: String(row.USERNAME ?? row.username ?? ""),
      role: String(row.ROLE ?? row.role ?? ""),
    };
  });
}

export async function listMyRecentTransactions(
  days = 30,
  userId = DEMO_USER_ID,
): Promise<TransactionRow[]> {
  return withConnection(async (conn) => {
    const result = await conn.execute<Record<string, unknown>>(
      `SELECT id, user_id, type, amount, asset, timestamp
       FROM transactions
       WHERE user_id = :userId
         AND timestamp >= SYSTIMESTAMP - NUMTODSINTERVAL(:days, 'DAY')
       ORDER BY timestamp DESC`,
      { userId, days },
    );
    return (result.rows ?? []).map((r) => ({
      id: Number(r.ID ?? r.id),
      user_id: Number(r.USER_ID ?? r.user_id),
      type: String(r.TYPE ?? r.type ?? ""),
      amount: Number(r.AMOUNT ?? r.amount ?? 0),
      asset:
        r.ASSET != null || r.asset != null
          ? String(r.ASSET ?? r.asset)
          : null,
      timestamp: String(r.TIMESTAMP ?? r.timestamp ?? ""),
    }));
  });
}
