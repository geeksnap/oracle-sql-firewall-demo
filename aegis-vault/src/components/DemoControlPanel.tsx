"use client";

import { useCallback, useState } from "react";
import type {
  DemoAction,
  DemoScope,
  InitManualFinalizeGuide,
} from "@lib/demo-control-types";
import type { DashboardMetrics, MonitoredAppStatus } from "@lib/types";
import { DemoControlButton } from "@/components/DemoControlButton";
import { DemoControlSection } from "@/components/DemoControlSection";
import { DemoOutputConsole } from "@/components/DemoOutputConsole";
import { InitDefaultPolicyModal } from "@/components/InitDefaultPolicyModal";
import { LuminaforgeFirewallControlCenter } from "@/components/LuminaforgeFirewallControlCenter";

function needsConfirm(scope: DemoScope, action: DemoAction): boolean {
  if (action === "firewall-disable") return true;
  if (action === "purge-violations") return true;
  if (action === "clear-firewall-policy") return true;
  if (action === "init-default-policy") return true;
  if (action === "generate-allow-list") return true;
  return false;
}

function confirmMessage(scope: DemoScope, action: DemoAction): string {
  if (action === "firewall-disable") {
    return "Disable SQL Firewall globally? All enforcement stops.";
  }
  if (action === "purge-violations") {
    const who =
      scope === "global"
        ? "luminaforge and AEGIS_APP"
        : scope === "aegis"
          ? "AEGIS_APP"
          : "luminaforge";
    return `Purge all violation logs for ${who}? Aegis Vault tables will clear.`;
  }
  if (action === "generate-allow-list") {
    return (
      "Generate allow-list from captured SQL? This stops the capture, builds the allow-list " +
      "from all captured statements, and enables SQL Monitor in log-only mode."
    );
  }
  if (action === "clear-firewall-policy") {
    return (
      "Clear captured SQL rules for luminaforge? This drops the allow-list and " +
      "capture logs. You must run capture training again before generating a new allow-list."
    );
  }
  if (action === "init-default-policy") {
    return (
      "Initialize default demo policy for luminaforge? Clears policy, starts SQL capture, " +
      "and seeds baseline benign SQL. You will finish with Stop SQL capture → Generate Allow List."
    );
  }
  return "Continue?";
}

interface DemoControlPanelProps {
  onFirewallGlobalChange?: (enabled: boolean) => void;
  onStatusRefresh?: (apps: MonitoredAppStatus[], metrics?: DashboardMetrics) => void;
}

export function DemoControlPanel({
  onFirewallGlobalChange,
  onStatusRefresh,
}: DemoControlPanelProps) {
  const [outputLog, setOutputLog] = useState("");
  const [busy, setBusy] = useState(false);
  const [initGuide, setInitGuide] = useState<InitManualFinalizeGuide | null>(null);
  const [initGuideOpen, setInitGuideOpen] = useState(false);

  const appendOutput = useCallback((scope: DemoScope, action: DemoAction, block: string) => {
    const header = `\n[${new Date().toLocaleTimeString()}] ${scope} / ${action}\n${"─".repeat(48)}\n`;
    setOutputLog((prev) => `${prev}${header}${block}\n`);
  }, []);

  const runAction = useCallback(
    async (scope: DemoScope, action: DemoAction) => {
      if (needsConfirm(scope, action) && !window.confirm(confirmMessage(scope, action))) {
        return;
      }

      setBusy(true);
      try {
        const res = await fetch("/api/demo-control/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope, action }),
        });
        const data = await res.json();
        const sql = data.sql ?? "(unknown)";
        const result = data.ok
          ? `SUCCESS\n${data.output ?? ""}`
          : `ERROR\n${data.output ?? data.error ?? "Unknown error"}`;
        appendOutput(scope, action, `-- SQL\n${sql}\n\n-- Result\n${result}`);

        if (data.ok && data.firewallGloballyEnabled !== undefined) {
          onFirewallGlobalChange?.(data.firewallGloballyEnabled);
        }
        if (data.ok && Array.isArray(data.apps)) {
          onStatusRefresh?.(data.apps, data.metrics);
        }
        if (data.ok && data.initManualFinalize) {
          setInitGuide(data.initManualFinalize as InitManualFinalizeGuide);
          setInitGuideOpen(true);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        appendOutput(scope, action, `CLIENT ERROR\n${message}`);
      } finally {
        setBusy(false);
      }
    },
    [appendOutput, onFirewallGlobalChange, onStatusRefresh],
  );

  const run = (scope: DemoScope, action: DemoAction) => () => void runAction(scope, action);

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel rounded-xl px-4 py-3">
        <h1 className="text-lg font-semibold text-[#fecaca]">Break-Glass Control</h1>
        <p className="mt-1 text-xs text-slate-500">
          Presenter operations — firewall demo controls (unlocked via break-glass login)
        </p>
      </div>
      <DemoControlSection
        title="1. System-wide Firewall Control"
        subtitle="Global DBMS_SQL_FIREWALL"
        titleClassName="text-[#fca5a5]"
        protect={
          <DemoControlButton
            compact
            label="Firewall on globally"
            variant="success"
            disabled={busy}
            onClick={run("global", "firewall-enable")}
          />
        }
        viewLeft={
          <DemoControlButton
            compact
            label="View violations (all)"
            variant="info"
            disabled={busy}
            onClick={run("global", "view-violations")}
          />
        }
        risk={
          <>
            <DemoControlButton
              compact
              label="Firewall off globally"
              variant="danger"
              disabled={busy}
              onClick={run("global", "firewall-disable")}
            />
            <DemoControlButton
              compact
              label="Clear all violation logs"
              variant="danger"
              disabled={busy}
              onClick={run("global", "purge-violations")}
            />
          </>
        }
      />

      <DemoControlSection
        title="2. Aegis Vault - Security Operation Center"
        subtitle="User AEGIS_APP — SQL Monitor ON · Block SQL OFF (fixed detect-only)"
        viewLeft={
          <DemoControlButton
            compact
            label="View violations"
            variant="info"
            disabled={busy}
            onClick={run("aegis", "view-violations")}
          />
        }
        risk={
          <DemoControlButton
            compact
            label="Clear violation logs"
            variant="danger"
            disabled={busy}
            onClick={run("aegis", "purge-violations")}
          />
        }
      />

      <LuminaforgeFirewallControlCenter busy={busy} onAction={runAction} />

      <DemoOutputConsole log={outputLog} />

      <InitDefaultPolicyModal
        open={initGuideOpen}
        guide={initGuide}
        onClose={() => setInitGuideOpen(false)}
      />
    </div>
  );
}
