"use client";

import { cn } from "@/lib/utils";
import type { NavSection } from "./sidebar-types";

export type { NavSection } from "./sidebar-types";

const PRIMARY_NAV: { id: "dashboard"; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
];

interface SidebarProps {
  active: NavSection;
  onSelect: (section: NavSection) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="glass-panel flex h-full flex-col rounded-xl p-4">
      <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-slate-500">
        Command Nav
      </p>
      <nav className="flex flex-1 flex-col gap-2">
        {PRIMARY_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "rounded-lg px-4 py-3 text-left text-sm transition-all",
              active === item.id
                ? "border border-[#00f9ff]/40 bg-[#00f9ff]/10 text-[#00f9ff] shadow-[0_0_16px_rgba(0,249,255,0.15)]"
                : "border border-transparent text-slate-400 hover:border-[#00f9ff]/20 hover:text-[#00f9ff]",
            )}
          >
            {item.label}
          </button>
        ))}

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => onSelect("break-glass-control")}
            className={cn(
              "w-full rounded-lg px-4 py-3 text-left text-sm transition-all",
              active === "break-glass-control"
                ? "border border-[#991b1b]/60 bg-[#7f1d1d]/25 text-[#fecaca] shadow-[0_0_16px_rgba(127,29,29,0.35)]"
                : "border border-[#7f1d1d]/35 bg-[#7f1d1d]/8 text-[#fca5a5] hover:border-[#991b1b]/50 hover:bg-[#7f1d1d]/15 hover:text-[#fecaca]",
            )}
          >
            Break-Glass Control
          </button>
        </div>
      </nav>
      <div className="mt-4 rounded-lg border border-[#7f1d1d]/20 bg-[#7f1d1d]/5 p-3 text-xs text-slate-400">
        Policy &amp; apps: <span className="text-[#fca5a5]">luminaforge</span>
        {" · "}
        Violations: <span className="text-[#00f9ff]">AEGIS_APP</span> + luminaforge
      </div>
    </aside>
  );
}
