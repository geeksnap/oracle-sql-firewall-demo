"use client";

import { useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { createSingleFlight } from "@/lib/single-flight";
import { GlassCard } from "./GlassCard";
import { ATTACK2_WAF_BYPASS_XML_HEX } from "@/lib/waf-bypass-demo-payloads";
import { WafBypassHintRow } from "@/components/WafBypassHintRow";
import { wafMirrorUrl } from "@/lib/waf-query-mirror";

export interface TxRow {
  ID?: number;
  id?: number;
  USER_ID?: number;
  user_id?: number;
  TYPE?: string;
  type?: string;
  AMOUNT?: number;
  amount?: number;
  ASSET?: string;
  asset?: string;
  TIMESTAMP?: string;
  timestamp?: string;
}

interface Props {
  onResults: (rows: TxRow[], err: string | null) => void;
}

const DEMO_HINT =
  "Demo: x' OR user_id<>1 -- (other clients) · ' OR 1=1 -- (full ledger)";

export function TransactionHistoryLookup({ onResults }: Props) {
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const runRecent = useMemo(() => createSingleFlight(), []);
  const abortRef = useRef<AbortController | null>(null);
  const searchSeqRef = useRef(0);

  async function showLast30Days() {
    const ran = await runRecent(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/transactions/recent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: 30 }),
        });
        const data = (await res.json()) as { rows?: TxRow[]; error?: string };
        onResults(data.rows ?? [], data.error ?? null);
      } catch {
        onResults([], "Could not load recent transactions");
      } finally {
        setLoading(false);
      }
    });
    if (ran === undefined) return;
  }

  async function searchLedger(overrideRef?: string) {
    const payload = (overrideRef ?? ref).trim();
    if (!payload) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const seq = ++searchSeqRef.current;

    setLoading(true);
    try {
      const res = await fetch(wafMirrorUrl("/api/transactions/filter", { ref: payload }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: payload }),
        signal: controller.signal,
      });
      if (seq !== searchSeqRef.current) return;
      const data = (await res.json()) as { rows?: TxRow[]; error?: string };
      onResults(data.rows ?? [], data.error ?? null);
    } catch (err) {
      if (seq !== searchSeqRef.current) return;
      if (err instanceof Error && err.name === "AbortError") return;
      onResults([], "Ledger lookup failed");
    } finally {
      if (seq === searchSeqRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <GlassCard>
      <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-slate-500">
        Platform ledger
      </p>
      <h2 className="mb-1 text-lg font-bold text-slate-100">
        Institutional Transaction Lookup
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Search transaction records across the firm by wire reference, transfer type,
        or counterparty code.
      </p>

      <div
        className={clsx(
          "flex flex-col gap-3 rounded-lg border px-3 py-2 sm:flex-row sm:items-center",
          "border-[rgba(244,201,93,0.22)]",
        )}
        style={{ background: "rgba(30,41,59,0.8)" }}
      >
        <svg
          className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void searchLedger()}
          placeholder="Wire reference, transfer type, or counterparty code…"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
        />
        <button
          type="button"
          onClick={() => void searchLedger()}
          disabled={loading}
          className="gold-btn shrink-0 rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search Ledger"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => void showLast30Days()}
        disabled={loading}
        className="mt-3 w-full rounded-lg border border-[rgba(244,201,93,0.35)] bg-transparent px-4 py-2.5 text-sm font-medium text-[#f4c95d] transition-colors hover:bg-[rgba(244,201,93,0.08)] disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Loading…" : "Show all my last 30 days records"}
      </button>

      <p className="mt-2 font-mono text-[10px] text-slate-600">{DEMO_HINT}</p>
      <WafBypassHintRow
        label="WAF bypass (XML/hex)"
        payload={ATTACK2_WAF_BYPASS_XML_HEX}
        onUse={(p) => {
          setRef(p);
          void searchLedger(p);
        }}
      />
    </GlassCard>
  );
}
