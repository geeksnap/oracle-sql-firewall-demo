"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CONFIRMATION = "RESET LUMINAFORGE DEMO DATA";
const TABLES = [
  "LUMINAFORGE.USERS",
  "LUMINAFORGE.PORTFOLIO",
  "LUMINAFORGE.TRANSACTIONS",
  "LUMINAFORGE.LUXURY_ITEMS",
] as const;

interface SeedResponse {
  ok?: boolean;
  output?: string;
  error?: string;
  seedAnchor?: string;
  seedCounts?: {
    users: number;
    portfolio: number;
    transactions: number;
    luxuryItems: number;
  };
  rolledBack?: boolean;
  mutationAttempted?: boolean;
}

interface InitializeDemoSeedModalProps {
  open: boolean;
  onClose: () => void;
  onGrantConsumed: () => void;
}

export function InitializeDemoSeedModal({
  open,
  onClose,
  onGrantConsumed,
}: InitializeDemoSeedModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SeedResponse | null>(null);
  const submitted = useRef(false);

  if (!open) return null;

  function close() {
    setConfirmation("");
    setResult(null);
    setBusy(false);
    submitted.current = false;
    onClose();
  }

  async function initialize() {
    if (
      confirmation !== CONFIRMATION ||
      busy ||
      submitted.current
    ) {
      return;
    }
    submitted.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/demo-control/execute", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "luminaforge",
          action: "initialize-demo-seed-data",
          confirmation,
        }),
      });
      const data = (await response.json()) as SeedResponse;
      const mutationAttempted = data.mutationAttempted === true;
      setResult(
        response.ok
          ? { ...data, mutationAttempted }
          : {
              ...data,
              ok: false,
              error: data.error ?? "Demo seed initialization failed",
              mutationAttempted,
            },
      );
    } catch {
      setResult({
        ok: false,
        error: "Could not reach demo seed initialization service",
        rolledBack: false,
      });
    } finally {
      setBusy(false);
      onGrantConsumed();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seed-reset-title"
    >
      <div className="glass-panel w-full max-w-xl rounded-xl border border-[#991b1b]/60 p-6 shadow-[0_0_50px_rgba(127,29,29,0.4)]">
        <h2 id="seed-reset-title" className="text-lg font-semibold text-[#fecaca]">
          Initialize Demo Seed Data
        </h2>

        {result ? (
          <div className="mt-4 space-y-3">
            <p className={result.ok ? "text-[#00ff9f]" : "text-[#ff2d55]"}>
              {result.ok ? "Demo seed initialization committed." : "Demo seed initialization failed."}
            </p>
            {result.seedAnchor && (
              <p className="text-sm text-slate-300">UTC anchor: {result.seedAnchor}</p>
            )}
            {result.seedCounts && (
              <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-slate-300">
                {`USERS=${result.seedCounts.users}\nPORTFOLIO=${result.seedCounts.portfolio}\nTRANSACTIONS=${result.seedCounts.transactions}\nLUXURY_ITEMS=${result.seedCounts.luxuryItems}`}
              </pre>
            )}
            {!result.ok && (
              <p className="text-sm text-slate-300">
                {result.error ?? result.output}
                {result.mutationAttempted
                  ? result.rolledBack
                    ? " No partial reset was committed."
                    : " Rollback could not be confirmed."
                  : null}
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-300">
              This replaces all rows in these LuminaForge demo tables:
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-[#fca5a5]">
              {TABLES.map((table) => <li key={table}>{table}</li>)}
            </ul>
            <label htmlFor="demo-seed-confirmation" className="mt-5 block text-xs uppercase tracking-wider text-slate-500">
              Type {CONFIRMATION} to continue
            </label>
            <input
              id="demo-seed-confirmation"
              autoFocus
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#7f1d1d]/50 bg-[#0a0a0f] px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-[#ff2d55]/70"
            />
          </>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 disabled:opacity-50"
          >
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={() => void initialize()}
              disabled={confirmation !== CONFIRMATION || busy}
              className={cn(
                "rounded-lg border border-[#ff2d55]/60 bg-[#7f1d1d]/35 px-4 py-2 text-sm font-semibold text-[#fecaca]",
                "hover:bg-[#7f1d1d]/55 disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {busy ? "Initializing…" : "Replace Demo Data"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { CONFIRMATION as DEMO_SEED_CONFIRMATION, TABLES as DEMO_SEED_TABLES };
