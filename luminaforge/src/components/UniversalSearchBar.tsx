"use client";

import { useState, useRef, useMemo } from "react";
import { createSingleFlight } from "@/lib/single-flight";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

interface SearchResult {
  id?: number;    ID?: number;
  name?: string;  NAME?: string;
  price?: number; PRICE?: number;
  category?: string; CATEGORY?: string;
}

export function UniversalSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const runSearch = useMemo(() => createSingleFlight(), []);

  async function search(q: string) {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setError(null);
    const ran = await runSearch(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/market/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q }),
        });
        const data = await res.json() as { rows?: SearchResult[]; error?: string };
        if (data.error) {
          setError(data.error);
          setResults([]);
        } else {
          setResults(data.rows ?? []);
        }
        setOpen(true);
      } catch {
        setError("Search unavailable");
      } finally {
        setLoading(false);
      }
    });
    if (ran === undefined) return;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      void search(query);
    }
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative w-full">
      <div
        className={clsx(
          "flex items-center gap-2 rounded-lg px-3 py-2 transition-all",
          "border",
          open
            ? "border-[rgba(244,201,93,0.5)] shadow-[0_0_16px_rgba(244,201,93,0.12)]"
            : "border-[rgba(244,201,93,0.18)]",
        )}
        style={{ background: "rgba(30,41,59,0.8)" }}
      >
        <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search assets, tickers, luxury items…"
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
        />
        {loading && (
          <div className="h-3 w-3 rounded-full border-2 border-[#f4c95d] border-t-transparent animate-spin" />
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="text-slate-500 hover:text-slate-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: "rgba(15,23,42,0.97)",
            border: "1px solid rgba(244,201,93,0.22)",
          }}
        >
          {error && (
            <div className="px-4 py-3 text-sm text-[#f43f5e] bg-[rgba(244,63,94,0.08)]">
              {error}
            </div>
          )}
          {!error && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500">No results found.</div>
          )}
          {!error && results.map((item, i) => (
            <button
              key={i}
              onMouseDown={() => router.push("/market")}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[rgba(244,201,93,0.07)] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-slate-200">{String(item.NAME ?? item.name ?? "")}</p>
                <p className="text-xs text-slate-500 capitalize">{String(item.CATEGORY ?? item.category ?? "")}</p>
              </div>
              <span className="text-sm font-semibold gold-text">
                ${Number(item.PRICE ?? item.price ?? 0).toLocaleString()}
              </span>
            </button>
          ))}
          <div className="px-4 py-2 text-[10px] text-slate-600 border-t border-[rgba(255,255,255,0.04)]">
            Press Enter to search · {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
