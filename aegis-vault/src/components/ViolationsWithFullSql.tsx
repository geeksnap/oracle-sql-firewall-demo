"use client";

import { useState } from "react";
import type { FirewallViolation } from "@lib/types";
import { cn } from "@/lib/utils";
import { FullSqlPanel } from "@/components/FullSqlPanel";
import { ViolationsTable } from "@/components/ViolationsTable";

type DetailShare = "half" | "third";

interface ViolationsWithFullSqlProps {
  violations: FirewallViolation[];
  title: string;
  showSourceApp?: boolean;
  showUser?: boolean;
  /** "half" = 50/50 table and Full SQL; "third" = table ~2/3, Full SQL ~1/3 */
  detailShare?: DetailShare;
  /** Fill parent height (Dashboard) instead of fixed min-height */
  fillHeight?: boolean;
  className?: string;
}

export function ViolationsWithFullSql({
  violations,
  title,
  showSourceApp,
  showUser = false,
  detailShare = "half",
  fillHeight = false,
  className,
}: ViolationsWithFullSqlProps) {
  const [selected, setSelected] = useState<FirewallViolation | null>(null);
  const tableFlex = detailShare === "third" ? "flex-[2]" : "flex-1";
  const detailFlex = detailShare === "third" ? "flex-1" : "flex-1";

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        fillHeight
          ? "h-full min-h-0 flex-1"
          : "min-h-[280px]",
        !fillHeight && detailShare === "half" && "min-h-[480px] flex-1 lg:min-h-0",
        className,
      )}
    >
      <div className={cn("flex min-h-0 flex-col", tableFlex)}>
        <ViolationsTable
          violations={violations}
          title={title}
          showSourceApp={showSourceApp}
          showUser={showUser}
          selectedId={selected?.id ?? null}
          onRowSelect={setSelected}
        />
      </div>
      <div className={cn("flex min-h-0 flex-col", detailFlex)}>
        <FullSqlPanel sqlText={selected?.sql_text ?? null} />
      </div>
    </div>
  );
}
