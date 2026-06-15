"use client";

import type { DashboardMetrics } from "@lib/types";
import { formatTime } from "@/lib/utils";

interface MetricsCardsProps {
  metrics: DashboardMetrics | null;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      label: "Total Violations",
      value: metrics?.total_violations ?? 0,
      accent: "#00f9ff",
    },
    {
      label: "LuminaForge Hits",
      value: metrics?.luminaforge_violations ?? 0,
      accent: "#ff2d55",
    },
    {
      label: "Aegis Hits",
      value: metrics?.aegis_violations ?? 0,
      accent: "#ff00aa",
    },
    {
      label: "Last Update",
      value: metrics?.last_poll_at
        ? formatTime(metrics.last_poll_at)
        : "—",
      accent: "#00ff9f",
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-panel rounded-xl p-4"
          style={{ borderColor: `${card.accent}33` }}
        >
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            {card.label}
          </p>
          <p
            className="mt-2 text-2xl font-bold"
            style={{ color: card.accent, textShadow: `0 0 12px ${card.accent}55` }}
          >
            {card.isText ? card.value : String(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
