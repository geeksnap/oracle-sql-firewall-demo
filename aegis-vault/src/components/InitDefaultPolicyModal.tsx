"use client";

import type { InitManualFinalizeGuide } from "@lib/demo-control-types";
import { cn } from "@/lib/utils";

interface InitDefaultPolicyModalProps {
  open: boolean;
  guide: InitManualFinalizeGuide | null;
  onClose: () => void;
}

export function InitDefaultPolicyModal({
  open,
  guide,
  onClose,
}: InitDefaultPolicyModalProps) {
  if (!open || !guide) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="init-default-policy-title"
    >
      <div className="glass-panel w-full max-w-lg rounded-xl border border-[#22d3ee]/30 p-6 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        <h2
          id="init-default-policy-title"
          className="text-lg font-semibold text-[#67e8f9]"
        >
          Capture training started
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          SQL capture is <span className="font-semibold text-green-400">ON</span> for
          luminaforge. Complete the allow-list manually when you are ready.
        </p>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            What we did (Steps 1–4)
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-slate-300">
            {guide.stepsCompleted.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Your next steps (Steps 5–7)
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm text-slate-200">
            {guide.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold",
              "border border-[#22d3ee]/40 bg-[#0891b2]/20 text-[#67e8f9]",
              "hover:bg-[#0891b2]/35",
            )}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
