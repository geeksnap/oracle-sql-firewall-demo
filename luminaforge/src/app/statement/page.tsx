"use client";

import { useState, useMemo } from "react";
import { createSingleFlight } from "@/lib/single-flight";
import { GlassCard } from "@/components/GlassCard";
import { StatementGrid, type StatementRow } from "@/components/StatementGrid";

const DEMO_HINT = `Demo payload → 0 UNION SELECT TO_CHAR(id), username, password, role FROM users`;

export default function StatementPage() {
  const [taxId, setTaxId] = useState("1");
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const runGenerate = useMemo(() => createSingleFlight(), []);

  async function generate() {
    setError(null);
    const ran = await runGenerate(async () => {
      setLoading(true);
      setGenerated(true);
      try {
        const res = await fetch("/api/statement/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taxId }),
        });
        const data = await res.json() as { rows?: StatementRow[]; error?: string };
        if (data.error) {
          setError(data.error);
          setRows([]);
        } else {
          setRows(data.rows ?? []);
        }
      } catch {
        setError("Request failed");
      } finally {
        setLoading(false);
      }
    });
    if (ran === undefined) return;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black gold-gradient mb-2">Tax Statement Generator</h1>
        <p className="text-slate-400 text-sm">
          Download your annual tax documents and transaction summaries for regulatory
          and institutional reporting.
        </p>
      </div>

      {/* Tax ID input card */}
      <GlassCard gold className="mb-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">
              Tax Institution ID
            </label>
            <input
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void generate()}
              placeholder="Enter your Tax Institution ID…"
              className="w-full rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none font-mono"
              style={{
                background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(244,201,93,0.2)",
              }}
            />
            <p className="mt-1.5 text-[10px] text-slate-600 font-mono">{DEMO_HINT}</p>
          </div>
          <button
            onClick={() => void generate()}
            disabled={loading}
            className="gold-btn rounded-lg px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate Statement"}
          </button>
        </div>
      </GlassCard>

      {/* Error */}
      {error && (
        <GlassCard className="mb-6" style={{ border: "1px solid rgba(244,63,94,0.3)" }}>
          <p className="text-sm text-[#f43f5e] font-mono">{error}</p>
        </GlassCard>
      )}

      {/* Statement output */}
      {generated && !error && (
        <StatementGrid rows={rows} taxId={taxId} />
      )}
    </div>
  );
}
