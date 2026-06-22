"use client";

import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { columnPayloadForTable } from "@/lib/market-demo-payloads";
import { alertIfWafBlocked, wafBlockErrorMessage } from "@/lib/waf-block-alert";
import { wafMirrorUrl } from "@/lib/waf-query-mirror";

interface LuxItem {
  ID?: number; id?: number;
  NAME?: string; name?: string;
  PRICE?: number; price?: number;
  CATEGORY?: string; category?: string;
}

const DEMO_HINT_SCHEMA =
  `Step 2 · Schema tables → ' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables -- (blocked on LB)`;
const DEMO_HINT_COLUMNS =
  `Step 3 · Table columns → ' AND 1=0 UNION SELECT ROWNUM, column_name || ' · ' || data_type, 0, 'COLUMNS' FROM user_tab_columns WHERE table_name = 'USERS' -- (blocked on LB)`;

function itemCategory(item: LuxItem): string {
  return String(item.CATEGORY ?? item.category ?? "").toUpperCase();
}

function isSchemaRow(item: LuxItem): boolean {
  return itemCategory(item) === "SCHEMA";
}

function isColumnsRow(item: LuxItem): boolean {
  return itemCategory(item) === "COLUMNS";
}

function isMetadataRow(item: LuxItem): boolean {
  return isSchemaRow(item) || isColumnsRow(item);
}

export default function MarketExplorerPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LuxItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const searchSeqRef = useRef(0);

  const columnsLeaked = useMemo(
    () => results.some(isColumnsRow),
    [results],
  );

  const schemaLeaked = useMemo(
    () => results.some(isSchemaRow),
    [results],
  );

  const displayResults = useMemo(() => {
    if (columnsLeaked) return results.filter(isColumnsRow);
    if (schemaLeaked) return results.filter(isSchemaRow);
    return results;
  }, [results, columnsLeaked, schemaLeaked]);

  function pivotToColumnDiscovery(item: LuxItem) {
    const tableName = String(item.NAME ?? item.name ?? "").trim();
    if (!tableName) return;
    setQuery(columnPayloadForTable(tableName));
    setError(null);
  }

  async function search() {
    const payload = queryRef.current.trim();
    if (!payload) return;

    const seq = ++searchSeqRef.current;
    setError(null);
    setResults([]);
    setLoading(true);
    setSearched(true);

    try {
      // Cancel stale in-flight calls so a new click always reflects latest input.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(wafMirrorUrl("/api/market/search", { q: payload }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: payload }),
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (seq !== searchSeqRef.current) return;

      if (res.status === 403) {
        alertIfWafBlocked(403);
        setError(wafBlockErrorMessage(403));
        return;
      }

      let data: { rows?: LuxItem[]; error?: string; message?: string; code?: string };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        if (seq !== searchSeqRef.current) return;
        setError(res.ok ? "Invalid response from server" : `HTTP ${res.status}`);
        return;
      }

      if (seq !== searchSeqRef.current) return;

      if (!res.ok) {
        setError(wafBlockErrorMessage(res.status, `HTTP ${res.status}`, data.message));
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      setResults(data.rows ?? []);
    } catch (err) {
      if (seq !== searchSeqRef.current) return;
      if (err instanceof Error && err.name === "AbortError") {
        setError("Search timed out after 30s — retry");
      } else {
        setError("Request failed — check network and retry");
      }
    } finally {
      if (seq === searchSeqRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black gold-gradient mb-2">Market Explorer</h1>
        <p className="text-slate-400 text-sm">
          Search market-priced investment instruments across equities, bonds, ETFs, crypto, and metals.
          Search by ticker, instrument type, or market keyword.
        </p>
      </div>

      {/* Search card */}
      <GlassCard gold className="mb-8">
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">
          Investment Type / Ticker Universal Search
        </label>
        <div className="flex gap-3 items-start">
          <input
            type="text"
            name="market-search-q"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              queryRef.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
            }}
            placeholder="Enter ticker, instrument type, or market keyword…"
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none font-mono h-11"
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(244,201,93,0.2)",
            }}
          />
          <button
            type="button"
            onClick={() => void search()}
            disabled={loading}
            className="gold-btn shrink-0 rounded-lg px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-600 font-mono">
          Step 1 · Boolean bypass → ' OR '1'='1 (canonical payload, blocked on LB URL)
        </p>
        <p className="mt-1 text-[10px] text-slate-600 font-mono">{DEMO_HINT_SCHEMA}</p>
        <p className="mt-1 text-[10px] text-slate-600 font-mono">{DEMO_HINT_COLUMNS}</p>
      </GlassCard>

      {/* Results */}
      {error && (
        <GlassCard className="mb-4 border-[rgba(244,63,94,0.3)]">
          <p className="text-sm text-[#f43f5e] font-mono">{error}</p>
        </GlassCard>
      )}

      {loading && searched && (
        <p className="mb-4 text-center text-sm text-slate-500">Searching…</p>
      )}

      {searched && !loading && !error && (
        <div>
          {columnsLeaked && (
            <div
              className="mb-4 rounded-lg px-4 py-2 text-xs font-semibold text-[#f43f5e]"
              style={{
                background: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.25)",
              }}
            >
              Column schema exposed via UNION injection — data dictionary columns leaked
            </div>
          )}
          {schemaLeaked && !columnsLeaked && (
            <div
              className="mb-4 rounded-lg px-4 py-2 text-xs font-semibold text-[#f43f5e]"
              style={{
                background: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.25)",
              }}
            >
              Schema metadata exposed via UNION injection — Oracle table names leaked
            </div>
          )}
          {schemaLeaked && !columnsLeaked && (
            <p className="mb-3 text-[10px] text-slate-500">
              Click a table card to load step 3 (column enumeration), then search.
            </p>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400">
              {displayResults.length} result{displayResults.length !== 1 ? "s" : ""} found
            </h2>
            {results.length > 0 && !schemaLeaked && !columnsLeaked && (
              <span className="text-xs text-slate-600">
                Investment pricing demo feed
              </span>
            )}
            {schemaLeaked && !columnsLeaked && (
              <span className="text-xs font-mono text-[#22d3ee]">
                Data dictionary — user_tables
              </span>
            )}
            {columnsLeaked && (
              <span className="text-xs font-mono text-[#a78bfa]">
                Data dictionary — user_tab_columns
              </span>
            )}
          </div>

          {displayResults.length === 0 ? (
            <GlassCard>
              <p className="text-sm text-slate-500 text-center py-4">No instruments matched your search.</p>
            </GlassCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayResults.map((item, i) => {
                const schema = isSchemaRow(item);
                const columns = isColumnsRow(item);
                const metadata = isMetadataRow(item);
                const name = String(item.NAME ?? item.name ?? "—");
                const price = Number(item.PRICE ?? item.price ?? 0);
                const cat = String(item.CATEGORY ?? item.category ?? "—");

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard
                      gold={!metadata}
                      className={`h-full ${schema ? "cursor-pointer transition hover:scale-[1.02]" : ""}`}
                      style={
                        schema
                          ? { border: "1px solid rgba(34,211,238,0.25)" }
                          : columns
                            ? { border: "1px solid rgba(167,139,250,0.3)" }
                            : undefined
                      }
                      onClick={schema ? () => pivotToColumnDiscovery(item) : undefined}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
                          style={{
                            background: columns
                              ? "rgba(167,139,250,0.1)"
                              : schema
                                ? "rgba(34,211,238,0.1)"
                                : "rgba(244,201,93,0.1)",
                            border: columns
                              ? "1px solid rgba(167,139,250,0.25)"
                              : schema
                                ? "1px solid rgba(34,211,238,0.2)"
                                : "1px solid rgba(244,201,93,0.2)",
                          }}
                        >
                          {columns ? "⫴" : schema ? "▦" : "◎"}
                        </div>
                        <span
                          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: columns
                              ? "rgba(167,139,250,0.1)"
                              : "rgba(34,211,238,0.08)",
                            color: columns ? "#a78bfa" : "#22d3ee",
                            border: columns
                              ? "1px solid rgba(167,139,250,0.25)"
                              : "1px solid rgba(34,211,238,0.2)",
                          }}
                        >
                          {cat}
                        </span>
                      </div>
                      <p
                        className="font-semibold mb-1 font-mono text-sm"
                        style={{ color: metadata ? "#e2e8f0" : undefined }}
                      >
                        {name}
                      </p>
                      {schema && (
                        <p className="mb-1 text-[10px] text-[#22d3ee]">
                          Click for step 3 → columns
                        </p>
                      )}
                      <p
                        className={`text-xl font-black ${metadata ? "text-slate-500" : "gold-text"}`}
                      >
                        {metadata ? "—" : `$${price.toLocaleString()}`}
                      </p>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
