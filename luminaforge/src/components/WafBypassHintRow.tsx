"use client";

import { useState } from "react";

interface Props {
  label: string;
  payload: string;
  onUse?: (payload: string) => void;
}

export function WafBypassHintRow({ label, payload, onUse }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyPayload() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-2">
      <p className="min-w-0 flex-1 break-all font-mono text-[10px] text-slate-600">
        <span className="text-slate-500">{label}: </span>
        {payload}
      </p>
      <div className="flex shrink-0 gap-1.5">
        {onUse && (
          <button
            type="button"
            onClick={() => onUse(payload)}
            className="rounded border border-[rgba(244,201,93,0.35)] px-2 py-0.5 text-[10px] font-medium text-[#f4c95d] hover:bg-[rgba(244,201,93,0.08)]"
          >
            Use
          </button>
        )}
        <button
          type="button"
          onClick={() => void copyPayload()}
          className="rounded border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-400 hover:bg-slate-800"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
