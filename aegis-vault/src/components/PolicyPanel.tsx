"use client";

import type { MonitoredAppStatus } from "@lib/types";
import { cn } from "@/lib/utils";

interface PolicyPanelProps {
  apps: MonitoredAppStatus[];
}

function flag(on: boolean, onLabel: string, offLabel: string) {
  return (
    <span className={on ? "text-[#00ff9f]" : "text-slate-500"}>
      {on ? onLabel : offLabel}
    </span>
  );
}

export function PolicyPanel({ apps }: PolicyPanelProps) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest neon-text-magenta">
        Firewall Policy
      </h2>
      {apps.length === 0 ? (
        <p className="text-sm text-slate-500">Awaiting status update…</p>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="rounded-lg border border-[#ff00aa]/20 bg-[#ff00aa]/5 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-white">{app.label}</span>
                <span
                  className={cn(
                    "max-w-[140px] text-right text-[9px] font-bold uppercase leading-tight",
                    app.firewall_control_tone === "protect" && "text-[#00ff9f]",
                    app.firewall_control_tone === "warn" && "text-[#fbbf24]",
                    app.firewall_control_tone === "off" && "text-[#fb923c]",
                    app.firewall_control_tone === "unknown" && "text-slate-400",
                  )}
                >
                  {app.firewall_control_label}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">{app.username}</p>
              <div className="mt-2 grid grid-cols-1 gap-1 text-[10px] text-slate-400">
                <div className="flex justify-between">
                  <span>SQL Monitor</span>
                  {flag(app.sql_monitor_enabled, "ON", "OFF")}
                </div>
                <div className="flex justify-between">
                  <span>Block SQL</span>
                  {flag(app.block_sql, "ON", "OFF")}
                </div>
                <div className="flex justify-between">
                  <span>Capture</span>
                  {flag(app.capture_active, "ON", "OFF")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
