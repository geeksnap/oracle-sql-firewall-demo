"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { BulkActionPanel } from "@/components/BulkActionPanel";

export default function BulkPage() {
  const [result, setResult] = useState<{ status: string; stmts?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleResult(r: { status: string; stmts?: number } | null, err: string | null) {
    setResult(r);
    setError(err);
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black gold-gradient mb-2">Bulk Asset Transfer</h1>
        <p className="text-slate-400 text-sm">
          Execute portfolio-wide batch operations — rebalancing, coordinated sells, and
          institutional transfers across multiple positions simultaneously.
        </p>
      </div>

      <BulkActionPanel onResult={handleResult} />

      {/* Result feedback */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            {error ? (
              <GlassCard style={{ border: "1px solid rgba(244,63,94,0.3)" }}>
                <p className="text-sm text-[#f43f5e] font-mono">{error}</p>
              </GlassCard>
            ) : (
              <GlassCard
                className="text-center py-6"
                style={{ border: "1px solid rgba(74,222,128,0.25)" }}
              >
                <div className="text-3xl mb-2">✓</div>
                <p className="text-base font-semibold text-green-400">
                  {result?.status ?? "Transfer complete"}
                </p>
                {result?.stmts !== undefined && result.stmts > 1 && (
                  <p className="mt-1 text-xs text-slate-600 font-mono">
                    {result.stmts} statement{result.stmts !== 1 ? "s" : ""} executed
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-500">
                  Your batch has been processed and submitted to settlement.
                </p>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
