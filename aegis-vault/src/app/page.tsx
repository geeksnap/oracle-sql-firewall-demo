"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DashboardMetrics,
  FirewallViolation,
  MonitoredAppStatus,
} from "@lib/types";
import { VIOLATION_LEDGER_LIMIT } from "@lib/violation-ledger";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { MetricsCards } from "@/components/MetricsCards";
import { MonitoredAppsPanel } from "@/components/MonitoredAppsPanel";
import { PolicyPanel } from "@/components/PolicyPanel";
import { ShieldGlobe } from "@/components/ShieldGlobe";
import { Sidebar, type NavSection } from "@/components/Sidebar";
import { DemoControlPanel } from "@/components/DemoControlPanel";
import { LatestThreatsPanel } from "@/components/LatestThreatsPanel";
import { ViolationsTable } from "@/components/ViolationsTable";

function isFirewallViolation(v: FirewallViolation): boolean {
  return v.source_app === "luminaforge" || v.source_app === "AEGIS_APP";
}

export default function HomePage() {
  const [section, setSection] = useState<NavSection>("dashboard");
  const [violations, setViolations] = useState<FirewallViolation[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [apps, setApps] = useState<MonitoredAppStatus[]>([]);
  const [dbConnected, setDbConnected] = useState(false);
  const [attackLabel, setAttackLabel] = useState<string | null>(null);
  const [statusCycleMs, setStatusCycleMs] = useState<number | undefined>();
  const [lastStatusAt, setLastStatusAt] = useState<string | undefined>();
  const [buildNumber, setBuildNumber] = useState<number | undefined>();
  const [dbPackageVersion, setDbPackageVersion] = useState<string | null>(null);
  const [dbPackageOk, setDbPackageOk] = useState<boolean | undefined>();
  const [socAllowListEnforced, setSocAllowListEnforced] = useState(false);
  const [firewallOverride, setFirewallOverride] = useState<boolean | null>(null);
  const [luminaAlertUntil, setLuminaAlertUntil] = useState(0);
  const [globeFlashing, setGlobeFlashing] = useState(false);
  const lastAttackAlertRef = useRef<{ key: string; at: number } | null>(null);
  const globeFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attackLabelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const violationsSnapshotSeededRef = useRef(false);
  const prevFirewallViolationCountRef = useRef<number | null>(null);

  const triggerGlobeFlash = useCallback(() => {
    setGlobeFlashing(true);
    if (globeFlashTimerRef.current) {
      clearTimeout(globeFlashTimerRef.current);
    }
    globeFlashTimerRef.current = setTimeout(() => {
      setGlobeFlashing(false);
      globeFlashTimerRef.current = null;
    }, 10_000);
  }, []);

  const handleNavSelect = useCallback((next: NavSection) => {
    setSection(next);
  }, []);

  useEffect(() => {
    void fetch("/api/build")
      .then((r) => r.json())
      .then((data: {
        build?: number;
        dbPackageVersion?: string | null;
        dbPackageOk?: boolean;
        socAllowListEnforced?: boolean;
      }) => {
        if (data.build != null) setBuildNumber(data.build);
        setDbPackageVersion(data.dbPackageVersion ?? null);
        setDbPackageOk(data.dbPackageOk);
        setSocAllowListEnforced(Boolean(data.socAllowListEnforced));
      })
      .catch(() => undefined);
  }, []);

  const handleMetrics = useCallback(
    (m: DashboardMetrics) => {
      const firewallCount = m.luminaforge_violations + m.aegis_violations;
      if (
        violationsSnapshotSeededRef.current &&
        prevFirewallViolationCountRef.current != null &&
        firewallCount > prevFirewallViolationCountRef.current
      ) {
        triggerGlobeFlash();
      }
      prevFirewallViolationCountRef.current = firewallCount;
      setMetrics(m);
      setFirewallOverride(null);
    },
    [triggerGlobeFlash],
  );

  const handleFirewallGlobalChange = useCallback((enabled: boolean) => {
    setFirewallOverride(enabled);
    setMetrics((prev) =>
      prev ? { ...prev, firewall_enabled: enabled } : prev,
    );
  }, []);

  const handleStatusRefresh = useCallback(
    (nextApps: MonitoredAppStatus[], nextMetrics?: DashboardMetrics) => {
      setApps(nextApps);
      if (nextMetrics) {
        setMetrics(nextMetrics);
        setFirewallOverride(null);
      }
    },
    [],
  );

  useEffect(() => {
    const socket = getSocket();

    socket.on("db-status", (status) => {
      setDbConnected(status.connected);
      if (status.cycle_ms != null) setStatusCycleMs(status.cycle_ms);
      if (status.polled_at) setLastStatusAt(status.polled_at);
      if (status.new_violations != null && status.new_violations > 0) {
        triggerGlobeFlash();
      }
    });

    socket.on("violations-snapshot", (snapshot) => {
      if (snapshot.length === 0) {
        violationsSnapshotSeededRef.current = false;
        prevFirewallViolationCountRef.current = null;
      }

      setViolations((prev) => {
        const detectedAt = new Map(
          prev.map((v) => [v.id, v.detected_at] as const),
        );
        const prevById = new Map(prev.map((v) => [v.id, v]));
        let shouldFlash = false;

        if (violationsSnapshotSeededRef.current) {
          for (const v of snapshot) {
            if (!isFirewallViolation(v)) continue;
            const old = prevById.get(v.id);
            if (!old || old.occurred_at !== v.occurred_at) {
              shouldFlash = true;
            }
          }
        } else {
          violationsSnapshotSeededRef.current = true;
        }

        if (shouldFlash) {
          queueMicrotask(() => triggerGlobeFlash());
        }

        return snapshot.map((v) => ({
          ...v,
          detected_at: detectedAt.get(v.id) ?? v.detected_at,
        }));
      });
    });

    socket.on("violation", (violation) => {
      setViolations((prev) =>
        [violation, ...prev].slice(0, VIOLATION_LEDGER_LIMIT),
      );
      if (isFirewallViolation(violation)) {
        triggerGlobeFlash();
      }
    });

    socket.on("metrics", handleMetrics);
    socket.on("monitored-apps", setApps);

    socket.on("attack-alert", (payload) => {
      const key = payload.violation.id;
      const last = lastAttackAlertRef.current;
      if (last?.key === key && Date.now() - last.at < 60_000) return;
      lastAttackAlertRef.current = { key, at: Date.now() };
      setAttackLabel(payload.message);
      setLuminaAlertUntil(Date.now() + 120_000);
      triggerGlobeFlash();
      if (attackLabelTimerRef.current) {
        clearTimeout(attackLabelTimerRef.current);
      }
      attackLabelTimerRef.current = setTimeout(() => {
        setAttackLabel(null);
        attackLabelTimerRef.current = null;
      }, 8000);
    });

    return () => {
      socket.off("db-status");
      socket.off("violations-snapshot");
      socket.off("violation");
      socket.off("metrics", handleMetrics);
      socket.off("monitored-apps");
      socket.off("attack-alert");
      if (attackLabelTimerRef.current) {
        clearTimeout(attackLabelTimerRef.current);
      }
      if (globeFlashTimerRef.current) {
        clearTimeout(globeFlashTimerRef.current);
      }
    };
  }, [handleMetrics, triggerGlobeFlash]);

  const firewallActive =
    firewallOverride ?? metrics?.firewall_enabled ?? true;

  const hasFirewallViolations = useMemo(
    () =>
      violations.some(
        (v) => v.source_app === "luminaforge" || v.source_app === "AEGIS_APP",
      ),
    [violations],
  );

  const globeAlertActive =
    attackLabel !== null ||
    Date.now() < luminaAlertUntil ||
    hasFirewallViolations;

  const globeAlertMessage =
    attackLabel ??
    (hasFirewallViolations ? "SQL Firewall Violation Detected" : null);

  const globeWarningActive = hasFirewallViolations && !globeFlashing;

  useEffect(() => {
    if (luminaAlertUntil <= Date.now()) return;
    const t = window.setTimeout(
      () => setLuminaAlertUntil(0),
      luminaAlertUntil - Date.now(),
    );
    return () => window.clearTimeout(t);
  }, [luminaAlertUntil]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] p-4 lg:p-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <Header
          firewallActive={firewallActive}
          dbConnected={dbConnected}
          attackLabel={attackLabel}
          statusCycleMs={statusCycleMs}
          lastStatusAt={lastStatusAt}
          buildNumber={buildNumber}
          dbPackageVersion={dbPackageVersion}
          dbPackageOk={dbPackageOk}
          socAllowListEnforced={socAllowListEnforced}
        />

        <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 items-stretch gap-4 lg:grid-cols-[220px_1fr_340px]">
          <Sidebar active={section} onSelect={handleNavSelect} />

          <section
            className={cn(
              "flex flex-col gap-4",
              section === "dashboard" && "min-h-0 flex-1",
            )}
          >
            {section === "dashboard" && (
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <div className="flex shrink-0 flex-col gap-4">
                  <MetricsCards metrics={metrics} />
                  <ShieldGlobe
                    alertMode={globeAlertActive}
                    flashMode={globeFlashing}
                    warningMode={globeWarningActive}
                    alertMessage={globeAlertMessage}
                  />
                </div>
                <div className="flex min-h-[50%] flex-1 flex-col">
                  <LatestThreatsPanel violations={violations} />
                </div>
              </div>
            )}

            {section === "break-glass-control" && (
              <div>
                <MetricsCards metrics={metrics} />
                <div className="mt-4">
                  <DemoControlPanel
                    onFirewallGlobalChange={handleFirewallGlobalChange}
                    onStatusRefresh={handleStatusRefresh}
                  />
                </div>
              </div>
            )}
          </section>

          <aside className="hidden flex-col gap-3 lg:flex">
            <MonitoredAppsPanel apps={apps} />
            <PolicyPanel apps={apps} />
            <ViolationsTable
              violations={violations}
              title="Live Violations"
              variant="compact"
              showUser={false}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
