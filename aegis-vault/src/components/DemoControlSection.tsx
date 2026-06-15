"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DemoControlSectionProps {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  protect?: ReactNode;
  viewLeft: ReactNode;
  viewMiddle?: ReactNode;
  risk: ReactNode;
}

export function DemoControlSection({
  title,
  subtitle,
  titleClassName,
  protect,
  viewLeft,
  viewMiddle,
  risk,
}: DemoControlSectionProps) {
  return (
    <section className="glass-panel rounded-xl p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className={cn(
              "text-sm font-semibold uppercase tracking-widest",
              titleClassName ?? "text-[#00f9ff]",
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{subtitle}</p>
          )}
        </div>
        {protect != null && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className="text-[9px] uppercase tracking-widest text-slate-600">Protect</p>
            <div className="min-w-[11.5rem]">{protect}</div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-2",
          viewMiddle != null ? "md:grid-cols-3" : "md:grid-cols-2",
        )}
      >
        <ActionColumn label="View">{viewLeft}</ActionColumn>
        {viewMiddle != null && <ActionColumn label="View">{viewMiddle}</ActionColumn>}
        <ActionColumn label="Risk">{risk}</ActionColumn>
      </div>
    </section>
  );
}

function ActionColumn({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] uppercase tracking-widest text-slate-600">{label}</p>
      {children}
    </div>
  );
}
