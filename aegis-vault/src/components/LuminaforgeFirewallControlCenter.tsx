"use client";

import type { DemoAction, DemoScope } from "@lib/demo-control-types";
import { DemoControlButton } from "@/components/DemoControlButton";

interface LuminaforgeFirewallControlCenterProps {
  busy: boolean;
  onAction: (scope: DemoScope, action: DemoAction) => void;
}

function ControlColumn({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}

export function LuminaforgeFirewallControlCenter({
  busy,
  onAction,
}: LuminaforgeFirewallControlCenterProps) {
  const run = (action: DemoAction) => () => onAction("luminaforge", action);

  return (
    <section className="glass-panel rounded-xl p-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-[#00f9ff]">
        3. Luminaforge — SQL Firewall Control Center
      </h2>
      <p className="mb-2 text-[11px] text-slate-500">User luminaforge</p>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <ControlColumn label="3.1 Firewall control">
          <DemoControlButton
            compact
            label="Enable SQL Monitoring"
            variant="success"
            disabled={busy}
            onClick={run("sql-monitor-enable")}
          />
          <DemoControlButton
            compact
            label="Disable SQL Monitoring"
            variant="default"
            disabled={busy}
            onClick={run("sql-monitor-disable")}
          />
          <DemoControlButton
            compact
            label="Enable block SQL"
            variant="success"
            disabled={busy}
            onClick={run("block-on")}
          />
          <DemoControlButton
            compact
            label="Disable block SQL"
            variant="info"
            disabled={busy}
            onClick={run("block-off")}
          />
        </ControlColumn>

        <ControlColumn label="3.2 Firewall info">
          <DemoControlButton
            compact
            label="View violations"
            variant="info"
            disabled={busy}
            onClick={run("view-violations")}
          />
          <DemoControlButton
            compact
            label="View capture status"
            variant="info"
            disabled={busy}
            onClick={run("view-capture-status")}
          />
          <DemoControlButton
            compact
            label="View SQL Monitor status"
            variant="info"
            disabled={busy}
            onClick={run("view-sql-monitor")}
          />
        </ControlColumn>

        <ControlColumn label="3.3 Firewall setup">
          <DemoControlButton
            compact
            label="Initialize default demo policy"
            variant="success"
            disabled={busy}
            onClick={run("init-default-policy")}
          />
          <DemoControlButton
            compact
            label="Start SQL capture"
            variant="info"
            disabled={busy}
            onClick={run("capture-on")}
          />
          <DemoControlButton
            compact
            label="Stop SQL capture"
            variant="default"
            disabled={busy}
            onClick={run("capture-off")}
          />
          <DemoControlButton
            compact
            label="Generate Allow List"
            variant="success"
            disabled={busy}
            onClick={run("generate-allow-list")}
          />
          <DemoControlButton
            compact
            label="Clear violation logs"
            variant="danger"
            disabled={busy}
            onClick={run("purge-violations")}
          />
          <DemoControlButton
            compact
            label="Clear captured SQL rules"
            variant="danger"
            disabled={busy}
            onClick={run("clear-firewall-policy")}
          />
        </ControlColumn>
      </div>
    </section>
  );
}
