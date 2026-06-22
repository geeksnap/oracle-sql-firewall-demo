"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import {
  TransactionHistoryLookup,
  type TxRow,
} from "@/components/TransactionHistoryLookup";

const DEFAULT_TX: TxRow[] = [
  { id: 1, user_id: 1, type: "BUY", asset: "AAPL", amount: 27825, timestamp: "2026-05-30" },
  { id: 2, user_id: 1, type: "SELL", asset: "AMZN", amount: 14200, timestamp: "2026-05-28" },
  { id: 3, user_id: 1, type: "DIVIDEND", asset: "QQQ", amount: 1240, timestamp: "2026-05-15" },
];

function rowAsset(tx: TxRow): string {
  const raw = tx.ASSET ?? tx.asset;
  return raw != null && String(raw).trim() !== "" ? String(raw) : "—";
}

function rowUserId(tx: TxRow): number | undefined {
  const raw = tx.USER_ID ?? tx.user_id;
  return raw != null ? Number(raw) : undefined;
}

export default function TransactionsPage() {
  const [rows, setRows] = useState<TxRow[]>(DEFAULT_TX);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const multipleClients = useMemo(
    () => rows.some((tx) => {
      const uid = rowUserId(tx);
      return uid != null && uid !== 1;
    }),
    [rows],
  );

  function handleResults(r: TxRow[], err: string | null) {
    setError(err);
    setRows(err ? [] : r);
    setSearched(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-black gold-gradient">Transaction History</h1>
        <p className="text-sm text-slate-400">
          Your portfolio activity — use the ledger lookup below to search transaction
          records.
        </p>
      </div>

      <div className="mb-6">
        <TransactionHistoryLookup onResults={handleResults} />
      </div>

      {error && (
        <GlassCard
          className="mb-4"
          style={{ border: "1px solid rgba(244,63,94,0.3)" }}
        >
          <p className="font-mono text-sm text-[#f43f5e]">{error}</p>
        </GlassCard>
      )}

      <GlassCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500">
              {searched ? "Ledger results" : "Recent transactions"}
            </h3>
            {multipleClients && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#f43f5e]">
                Multiple client IDs detected
              </p>
            )}
          </div>
          <span className="text-xs text-slate-600">
            {rows.length} record{rows.length !== 1 ? "s" : ""}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            <p>No transactions found.</p>
            {searched && !error && (
              <p className="mt-2 font-mono text-[10px] text-slate-600">
                Injection returned 0 rows — run{" "}
                <span className="text-[#f4c95d]">luminaforge/scripts/reset-demo-data.sql</span>{" "}
                to restore cross-client ledger rows (user_id 3, 4, 5, 8, 9), or try{" "}
                <span className="text-[#f4c95d]">&apos; OR 1=1 --</span> for all demo_user rows.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs text-slate-600">
                  <th className="pb-3 pr-4 font-medium">ID</th>
                  <th className="pb-3 pr-4 font-semibold text-[#f4c95d]">User ID</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Asset</th>
                  <th className="pb-3 pr-4 text-right font-medium">Amount</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tx, i) => {
                  const id = tx.ID ?? tx.id;
                  const userId = rowUserId(tx);
                  const type = tx.TYPE ?? tx.type ?? "—";
                  const amount = Number(tx.AMOUNT ?? tx.amount ?? 0);
                  const ts = String(tx.TIMESTAMP ?? tx.timestamp ?? "—");
                  const foreignUser = userId != null && userId !== 1;

                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-[rgba(255,255,255,0.04)] last:border-0"
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-slate-500">
                        {String(id ?? "—")}
                      </td>
                      <td
                        className={clsx(
                          "py-3 pr-4 font-mono text-sm font-semibold",
                          foreignUser ? "text-[#f43f5e]" : "text-slate-300",
                        )}
                      >
                        {String(userId ?? "—")}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="rounded px-2 py-0.5 text-xs font-semibold uppercase"
                          style={{
                            background:
                              type === "BUY"
                                ? "rgba(74,222,128,0.1)"
                                : type === "SELL"
                                  ? "rgba(244,63,94,0.1)"
                                  : "rgba(244,201,93,0.1)",
                            color:
                              type === "BUY"
                                ? "#4ade80"
                                : type === "SELL"
                                  ? "#f43f5e"
                                  : "#f4c95d",
                          }}
                        >
                          {type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs font-medium text-slate-300">
                        {rowAsset(tx)}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold gold-text">
                        ${amount.toLocaleString()}
                      </td>
                      <td className="py-3 text-xs text-slate-500">
                        {ts.slice(0, 16)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
