"use client";

import { formatTime } from "@/lib/utils";

interface HeaderProps {
  firewallActive: boolean;
  dbConnected: boolean;
  attackLabel: string | null;
  statusCycleMs?: number;
  lastStatusAt?: string;
  buildNumber?: number;
  dbPackageVersion?: string | null;
  dbPackageOk?: boolean;
  socAllowListEnforced?: boolean;
}

export function Header({
  firewallActive,
  dbConnected,
  attackLabel,
  statusCycleMs,
  lastStatusAt,
  buildNumber,
  dbPackageVersion,
  dbPackageOk,
  socAllowListEnforced,
}: HeaderProps) {
  const appBuild =
    buildNumber ?? Number(process.env.NEXT_PUBLIC_BUILD_NUMBER ?? "0");
  const expectedDbPkg = process.env.NEXT_PUBLIC_DB_PACKAGE_VERSION ?? "?";

  return (
    <header className="glass-panel flex items-center justify-between rounded-xl px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#00f9ff]/50 bg-[#00f9ff]/10">
          <span className="text-xl font-bold neon-text-cyan">⛨</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-[0.2em] neon-text-cyan">
            AEGIS VAULT
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Oracle SQL Firewall · AHDB2605_PDB1 · build {appBuild}
            {dbPackageVersion != null && (
              <span
                className={
                  dbPackageOk === false ? " text-[#ff2d55]" : " text-slate-500"
                }
              >
                {" "}
                · db pkg {dbPackageVersion}
                {dbPackageOk === false ? ` (need ${expectedDbPkg})` : ""}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {socAllowListEnforced && (
          <div
            className="max-w-md rounded-lg border border-[#ff2d55] bg-[#ff2d55]/15 px-3 py-2 text-xs font-medium text-[#ff2d55]"
            title="Run Oracle_DB_Repair_AEGIS_SOC.sql as SYS AS SYSDBA"
          >
            SOC blocked (ORA-47605) — AEGIS_APP SQL Monitor is ON. Run{" "}
            <span className="font-mono">@Oracle_DB_Repair_AEGIS_SOC.sql</span> as
            SYS.
          </div>
        )}
        {attackLabel && (
          <div className="alert-pulse rounded-lg border border-[#ff2d55] bg-[#ff2d55]/15 px-4 py-2 text-sm font-semibold text-[#ff2d55]">
            {attackLabel}
          </div>
        )}
        <StatusPill
          label="Firewall"
          active={firewallActive}
          activeText="ACTIVE"
          inactiveText="OFFLINE"
        />
        <StatusPill
          label="Database"
          active={dbConnected}
          activeText="CONNECTED"
          inactiveText="DISCONNECTED"
        />
        {dbConnected && statusCycleMs != null && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Status Update
            </p>
            <p className="text-sm font-semibold text-[#00f9ff]">
              {statusCycleMs}ms
              {lastStatusAt
                ? ` · ${formatTime(lastStatusAt)}`
                : ""}
            </p>
          </div>
        )}
      </div>
    </header>
  );
}

function StatusPill({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p
        className={`text-sm font-semibold ${active ? "text-[#00ff9f]" : "text-[#ff2d55]"}`}
      >
        {active ? activeText : inactiveText}
      </p>
    </div>
  );
}
