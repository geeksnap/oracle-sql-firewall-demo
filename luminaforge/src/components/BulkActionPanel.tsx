"use client";

import { useState, useMemo } from "react";
import { createSingleFlight } from "@/lib/single-flight";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { ATTACK4_WAF_BYPASS_FALLBACK } from "@/lib/waf-bypass-demo-payloads";
import { alertIfWafBlocked, WAF_BLOCK_INLINE_ERROR } from "@/lib/waf-block-alert";
import { wafMirrorUrl } from "@/lib/waf-query-mirror";

interface Props {
  onResult: (result: { status: string; stmts?: number } | null, err: string | null) => void;
}

const DEMO_HINT = `Demo payload → ; UPDATE users SET role='admin' WHERE id=1 --`;

const ASSET_OPTIONS = [
  { symbol: "AAPL", qty: 150 },
  { symbol: "ORCL", qty: 200 },
];

export function BulkActionPanel({ onResult }: Props) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const runExecute = useMemo(() => createSingleFlight(), []);

  async function execute() {
    const ran = await runExecute(async () => {
      setLoading(true);
      try {
        const res = await fetch(wafMirrorUrl("/api/bulk/execute", { note }), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        });

        if (res.status === 403) {
          alertIfWafBlocked(403);
          onResult(null, WAF_BLOCK_INLINE_ERROR);
          return;
        }

        if (!res.ok) {
          onResult(null, `HTTP ${res.status}`);
          return;
        }

        const data = await res.json() as { status?: string; stmtsExecuted?: number; error?: string };
        if (data.error) {
          onResult(null, data.error);
        } else {
          onResult({ status: data.status ?? "Transfer complete", stmts: data.stmtsExecuted }, null);
        }
      } catch {
        onResult(null, "Request failed");
      } finally {
        setLoading(false);
      }
    });
    if (ran === undefined) return;
  }

  return (
    <GlassCard gold>
      <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Bulk Asset Transfer</h3>

      {/* Asset selection (decorative for demo) */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {ASSET_OPTIONS.map((a) => (
          <div
            key={a.symbol}
            className="rounded-lg px-3 py-2.5 flex items-center justify-between"
            style={{
              background: "rgba(34,211,238,0.06)",
              border: "1px solid rgba(34,211,238,0.15)",
            }}
          >
            <div>
              <p className="text-sm font-bold text-slate-200">{a.symbol}</p>
              <p className="text-xs text-slate-500">{a.qty} units</p>
            </div>
            <input type="checkbox" defaultChecked className="accent-[#f4c95d] w-4 h-4" />
          </div>
        ))}
      </div>

      {/* Batch Execution Note — Attack Point 4 */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">
          Batch Execution Note
        </label>
        <input
          type="text"
          name="bulk-execution-note"
          autoComplete="off"
          spellCheck={false}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void execute()}
          placeholder="Add a memo for this batch operation…"
          className="w-full h-11 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none font-mono"
          style={{
            background: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(244,201,93,0.2)",
          }}
        />
        <p className="mt-1 text-[10px] text-slate-600 font-mono">{DEMO_HINT}</p>
        <p className="mt-1 text-[10px] text-slate-600 font-mono break-all">
          {ATTACK4_WAF_BYPASS_FALLBACK}
        </p>
      </div>

      <button
        onClick={() => void execute()}
        disabled={loading}
        className="gold-btn w-full rounded-lg py-2.5 text-sm disabled:opacity-50"
      >
        {loading ? "Executing batch transfer…" : "Execute Bulk Transfer"}
      </button>
    </GlassCard>
  );
}
