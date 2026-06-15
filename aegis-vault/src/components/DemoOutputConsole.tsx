"use client";

import { useEffect, useRef } from "react";

interface DemoOutputConsoleProps {
  log: string;
}

export function DemoOutputConsole({ log }: DemoOutputConsoleProps) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="glass-panel rounded-xl p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#00f9ff]">
        Output
      </h2>
      <pre
        ref={ref}
        className="min-h-[15rem] max-h-[15rem] overflow-y-auto rounded-lg border border-[#00f9ff]/15 bg-black/50 p-3 font-mono text-xs leading-relaxed text-slate-300"
      >
        {log || "— Execute a demo control action. SQL and results appear here. —"}
      </pre>
    </div>
  );
}
