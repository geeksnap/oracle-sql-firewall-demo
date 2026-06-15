"use client";

interface FullSqlPanelProps {
  sqlText: string | null;
}

export function FullSqlPanel({ sqlText }: FullSqlPanelProps) {
  return (
    <div className="glass-panel flex h-full min-h-0 flex-col rounded-xl p-4">
      <h2 className="mb-3 shrink-0 text-sm font-semibold uppercase tracking-widest neon-text-cyan">
        Full SQL
      </h2>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#00f9ff]/15 bg-black/30 p-3">
        {sqlText == null ? (
          <p className="text-xs text-slate-500">
            Select a violation row to view full SQL.
          </p>
        ) : (
          <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-slate-200">
            {sqlText}
          </pre>
        )}
      </div>
    </div>
  );
}
