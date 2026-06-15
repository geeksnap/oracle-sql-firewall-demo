"use client";

import { motion } from "framer-motion";

export interface StatementRow {
  REF?: string; ref?: string;
  DESCRIPTION?: string; description?: string;
  AMOUNT?: string; amount?: string;
  ISSUED?: string; issued?: string;
  // catch-all for oracledb uppercase keys
  [key: string]: unknown;
}

interface Props {
  rows: StatementRow[];
  taxId: string;
}

const HEADERS = [
  { key: "ref", label: "Transaction ID" },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount (USD)" },
  { key: "issued", label: "Date Issued" },
];

function cell(row: StatementRow, key: string): string {
  const upper = key.toUpperCase();
  const v = row[upper] ?? row[key];
  return v != null ? String(v) : "—";
}

const TX_TYPES = new Set([
  "BUY", "SELL", "DIVIDEND", "WIRE", "FX", "SETTLE", "REBALANCE", "INTEREST", "TRANSFER", "BULK",
]);
const USER_ROLES = new Set([
  "premium", "vip", "admin", "audit", "compliance", "service", "risk",
]);

export function StatementGrid({ rows, taxId }: Props) {
  const isLeaked = rows.some((r) => {
    const desc = String(r.DESCRIPTION ?? r.description ?? "").toUpperCase();
    const issued = String(r.ISSUED ?? r.issued ?? "").toLowerCase();
    return USER_ROLES.has(issued) && !TX_TYPES.has(desc);
  });

  return (
    <div>
      {/* Statement header */}
      <div
        className="rounded-t-xl px-6 py-4"
        style={{
          background: "linear-gradient(135deg, rgba(244,201,93,0.12), rgba(15,23,42,0.8))",
          border: "1px solid rgba(244,201,93,0.22)",
          borderBottom: "none",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Annual Tax Statement — FY 2026
            </p>
            <p className="text-lg font-bold gold-text mt-0.5">LuminaForge Wealth Management</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Institution Reference</p>
            <p className="text-sm font-mono text-slate-300">{taxId}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto rounded-b-xl"
        style={{
          border: "1px solid rgba(244,201,93,0.22)",
          borderTop: isLeaked ? "1px solid rgba(244,63,94,0.4)" : undefined,
          background: "rgba(15,23,42,0.6)",
        }}
      >
        {isLeaked && (
          <div className="px-6 py-2 text-xs font-semibold text-[#f43f5e] bg-[rgba(244,63,94,0.08)] border-b border-[rgba(244,63,94,0.2)]">
            ⚠ Credential data exposed via UNION injection
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left text-xs text-slate-500"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {HEADERS.map((h) => (
                <th key={h.key} className="px-6 py-3 font-medium">{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-600 text-sm">
                  No statement data for this Tax Institution ID.
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-[rgba(255,255,255,0.04)] last:border-0"
                style={isLeaked ? { background: "rgba(244,63,94,0.04)" } : {}}
              >
                {HEADERS.map((h) => (
                  <td
                    key={h.key}
                    className="px-6 py-3 font-mono text-xs"
                    style={{
                      color: isLeaked
                        ? h.key === "amount" ? "#f43f5e" : "#f1f5f9"
                        : h.key === "amount" ? "#f4c95d" : "#94a3b8",
                    }}
                  >
                    {cell(row, h.key)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
        <div
          className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="text-[10px] text-slate-700">
            Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="text-[10px] text-slate-700">{rows.length} line item{rows.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </div>
  );
}
