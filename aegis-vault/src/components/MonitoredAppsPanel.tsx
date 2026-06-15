"use client";

import type { FirewallDefenceStatus, MonitoredAppStatus } from "@lib/types";
import { cn } from "@/lib/utils";

interface MonitoredAppsPanelProps {
  apps: MonitoredAppStatus[];
}

const DEFENCE_HIGHLIGHT: Record<
  FirewallDefenceStatus,
  { pill: string; card: string }
> = {
  "enforced-block": {
    pill: "border border-[#00ff9f]/50 bg-[#00ff9f]/20 text-[#00ff9f] shadow-[0_0_12px_rgba(0,255,159,0.25)]",
    card: "border-[#00ff9f]/40 bg-[#00ff9f]/8",
  },
  "enforced-log": {
    pill: "border border-[#fbbf24]/45 bg-[#fbbf24]/15 text-[#fbbf24]",
    card: "border-[#fbbf24]/35 bg-[#fbbf24]/8",
  },
  "allow-list-off": {
    pill: "border border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]",
    card: "border-[#fb923c]/30 bg-[#fb923c]/5",
  },
  "allow-list-off-block-armed": {
    pill: "border border-[#f97316]/50 bg-[#f97316]/15 text-[#fb923c] shadow-[0_0_10px_rgba(249,115,22,0.2)]",
    card: "border-[#f97316]/35 bg-[#f97316]/8",
  },
  "firewall-off": {
    pill: "border border-[#991b1b]/50 bg-[#7f1d1d]/20 text-[#fca5a5]",
    card: "border-[#991b1b]/40 bg-[#7f1d1d]/10",
  },
  "policy-cleared": {
    pill: "border border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#7dd3fc]",
    card: "border-[#38bdf8]/30 bg-[#38bdf8]/5",
  },
  "ready-for-capture": {
    pill: "border border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]",
    card: "border-[#fb923c]/30 bg-[#fb923c]/5",
  },
  "capture-active": {
    pill: "border border-[#fbbf24]/45 bg-[#fbbf24]/15 text-[#fbbf24]",
    card: "border-[#fbbf24]/35 bg-[#fbbf24]/8",
  },
  "not-configured": {
    pill: "border border-dashed border-slate-500/50 bg-slate-800/30 text-slate-400",
    card: "border-slate-600/40 bg-slate-800/20",
  },
};

export function MonitoredAppsPanel({ apps }: MonitoredAppsPanelProps) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest neon-text-magenta">
        Monitored Apps
      </h2>
      <div className="space-y-3">
        {apps.length === 0 && (
          <p className="text-sm text-slate-500">Awaiting status update…</p>
        )}
        {apps.map((app) => {
          const highlight = DEFENCE_HIGHLIGHT[app.defence_status];
          return (
            <div
              key={app.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                app.has_alert
                  ? "border-[#ff2d55]/50 bg-[#ff2d55]/10"
                  : highlight.card,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{app.label}</p>
                  <p className="text-xs text-slate-400">{app.username}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">
                    Defence status
                  </p>
                  <span
                    className={cn(
                      "max-w-[150px] rounded-full px-2 py-1 text-center text-[9px] font-bold uppercase leading-tight",
                      highlight.pill,
                      app.has_alert && "ring-1 ring-[#ff2d55]/40",
                    )}
                  >
                    {app.firewall_control_label}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>Capture: {app.capture_active ? "ON" : "OFF"}</span>
                <span>Violations: {app.violation_count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
