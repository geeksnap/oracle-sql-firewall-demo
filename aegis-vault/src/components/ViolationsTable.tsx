"use client";

import type { FirewallViolation } from "@lib/types";
import { cn, formatTime } from "@/lib/utils";

export type ViolationsTableVariant = "full" | "compact";

interface ViolationsTableProps {
  violations: FirewallViolation[];
  title?: string;
  variant?: ViolationsTableVariant;
  showSourceApp?: boolean;
  showUser?: boolean;
  showAction?: boolean;
  selectedId?: string | null;
  onRowSelect?: (violation: FirewallViolation) => void;
}

function actionCellClass(label: string): string {
  if (label === "Break-Glass Logged in") {
    return "font-semibold text-[#fbbf24]";
  }
  if (label === "Blocked") {
    return "font-semibold text-[#ff2d55]";
  }
  if (label === "Logged without Block") {
    return "font-medium text-[#fbbf24]";
  }
  return "text-slate-400";
}

function sourceAppClass(sourceApp: string): string {
  if (sourceApp === "luminaforge") return "text-[#ff2d55]";
  if (sourceApp === "Aegis Vault") return "text-[#fbbf24]";
  return "text-[#00f9ff]";
}

function typeCellValue(v: FirewallViolation, isCompact: boolean): string {
  if (isCompact && v.source_app === "Aegis Vault") {
    return v.action_label;
  }
  return v.violation_type;
}

export function ViolationsTable({
  violations,
  title = "Real-time Violations",
  variant = "full",
  showSourceApp = true,
  showUser = false,
  showAction = true,
  selectedId = null,
  onRowSelect,
}: ViolationsTableProps) {
  const isCompact = variant === "compact";
  const selectable = Boolean(onRowSelect);
  const showApp = isCompact || showSourceApp;
  const showUserCol = !isCompact && showUser;
  const showActionCol = !isCompact && showAction;
  const showSql = !isCompact;

  const colCount =
    1 +
    (showApp ? 1 : 0) +
    (showUserCol ? 1 : 0) +
    1 +
    (showActionCol ? 1 : 0) +
    (showSql ? 1 : 0);

  return (
    <div className="glass-panel flex h-full flex-col rounded-xl p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest neon-text-cyan">
        {title}
      </h2>
      <div className="flex-1 overflow-auto">
        <table
          className={cn(
            "w-full text-left text-xs",
            isCompact ? "table-fixed" : "min-w-[600px]",
          )}
        >
          <thead>
            <tr className="border-b border-[#00f9ff]/20 text-slate-500">
              <th className={cn("pb-2 pr-2", isCompact && "w-[38%]")}>Time</th>
              {showApp && (
                <th className={cn("pb-2 pr-2", isCompact && "w-[32%]")}>
                  Source App
                </th>
              )}
              {showUserCol && <th className="pb-2 pr-3">User</th>}
              <th className={cn("pb-2", isCompact ? "w-[30%]" : "pr-3")}>
                Type
              </th>
              {showActionCol && <th className="pb-2 pr-3">Action</th>}
              {showSql && <th className="pb-2">SQL</th>}
            </tr>
          </thead>
          <tbody>
            {violations.length === 0 && (
              <tr>
                <td colSpan={colCount} className="py-8 text-center text-slate-500">
                  No violations recorded yet. Trigger LuminaForge attack points to populate.
                </td>
              </tr>
            )}
            {violations.map((v) => {
              const isSelected = selectable && selectedId === v.id;
              return (
              <tr
                key={v.id}
                role={selectable ? "button" : undefined}
                tabIndex={selectable ? 0 : undefined}
                onClick={
                  selectable
                    ? () => onRowSelect?.(v)
                    : undefined
                }
                onKeyDown={
                  selectable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowSelect?.(v);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "border-b border-white/5",
                  selectable && "cursor-pointer hover:bg-[#00f9ff]/5",
                  isSelected && "bg-[#00f9ff]/15",
                )}
              >
                <td
                  className={cn(
                    "py-2 text-slate-400",
                    isCompact ? "pr-2 truncate" : "pr-3",
                  )}
                >
                  {formatTime(v.occurred_at)}
                </td>
                {showApp && (
                  <td className={cn("py-2", isCompact ? "pr-2 truncate" : "pr-3")}>
                    <span className={sourceAppClass(v.source_app)}>
                      {v.source_app}
                    </span>
                  </td>
                )}
                {showUserCol && <td className="py-2 pr-3">{v.username}</td>}
                <td
                  className={cn(
                    "py-2 text-[#ff00aa]",
                    isCompact ? "truncate" : "pr-3",
                  )}
                >
                  {typeCellValue(v, isCompact)}
                </td>
                {showActionCol && (
                  <td className={cn("py-2 pr-3", actionCellClass(v.action_label))}>
                    {v.action_label}
                  </td>
                )}
                {showSql && (
                  <td className="max-w-[240px] truncate py-2 font-mono text-slate-300">
                    {v.sql_text}
                  </td>
                )}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
