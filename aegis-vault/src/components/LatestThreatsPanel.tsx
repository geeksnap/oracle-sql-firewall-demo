"use client";

import type { FirewallViolation } from "@lib/types";
import { ViolationsWithFullSql } from "@/components/ViolationsWithFullSql";

interface LatestThreatsPanelProps {
  violations: FirewallViolation[];
}

export function LatestThreatsPanel({ violations }: LatestThreatsPanelProps) {
  return (
    <ViolationsWithFullSql
      violations={violations}
      title="Latest Threats"
      showUser={false}
      detailShare="third"
      fillHeight
      className="h-full"
    />
  );
}
