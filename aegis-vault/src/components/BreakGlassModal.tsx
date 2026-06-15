"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface BreakGlassModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BreakGlassModal({ open, onClose, onSuccess }: BreakGlassModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit() {
    const user = username.trim();
    if (!user) {
      setError("Break-Glass User is required");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/break-glass/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      setUsername("");
      setPassword("");
      onSuccess();
    } catch {
      setError("Could not reach break-glass service");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="break-glass-title"
    >
      <div className="glass-panel w-full max-w-md rounded-xl border border-[#991b1b]/50 p-6 shadow-[0_0_40px_rgba(127,29,29,0.35)]">
        <h2
          id="break-glass-title"
          className="text-lg font-semibold text-[#fecaca]"
        >
          Break-Glass Access
        </h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-500">
              Break-Glass User
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              autoFocus
              className="w-full rounded-lg border border-[#7f1d1d]/40 bg-[#0a0a0f] px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#991b1b]/60"
              placeholder="e.g. ops-lead"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-500">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              className="w-full rounded-lg border border-[#7f1d1d]/40 bg-[#0a0a0f] px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#991b1b]/60"
              placeholder="Demo — any value"
            />
          </div>
          {error && (
            <p className="text-sm text-[#ff2d55]">{error}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold",
              "border border-[#991b1b]/60 bg-[#7f1d1d]/30 text-[#fecaca]",
              "hover:bg-[#7f1d1d]/50 disabled:opacity-50",
            )}
          >
            {busy ? "Signing in…" : "Break-Glass Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
