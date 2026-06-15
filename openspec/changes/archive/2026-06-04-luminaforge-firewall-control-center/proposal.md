## Why

Presenters need a clearer story for **Aegis Vault (SOC)**: detect/monitor is always on, block is never on—and that posture must not be confused with LuminaForge toggles. LuminaForge Demo Control is also split across two sections; merging into a single **Firewall Control Center** with labeled sub-sections (control / info / setup) matches how demos are narrated.

## What Changes

- **Aegis Vault (`AEGIS_APP`) posture (UI):** Always show **SQL Monitor ON** and **Block SQL OFF** in Monitored Apps and Firewall Policy when global firewall is enabled. Defence label remains fixed **DETECT · LOG ONLY** (block cannot be enabled from Demo Control).
- **Demo Control §2 Security Operation Center:** Remove **View SQL Monitor status** and **View capture status**; keep **View violations** and **Clear violation logs** only.
- **Demo Control §3 LuminaForge:** Replace separate “Firewall Setup” + “SQL Monitor & operations” with one section **3. Luminaforge — Firewall Control Center** containing:
  - **3.1 Firewall control** — SQL Monitoring enable/disable; Block SQL enable/disable
  - **3.2 Firewall info** — View violations; View capture status; View SQL Monitor status
  - **3.3 Firewall setup** — SQL capture start/stop; Clear violation logs
- **Backend (LuminaForge only):** Add `sql-monitor-enable` demo action (pair to existing `sql-monitor-disable`); wire enable to package (`ENABLE_ALLOW_LIST` log-only or re-enable monitor).

## Capabilities

### New Capabilities

- `luminaforge-firewall-control-center`: SOC fixed detect posture display, trimmed SOC Demo Control buttons, merged LuminaForge control center layout, SQL Monitor enable action.

### Modified Capabilities

- _(none under `openspec/specs/`)_

## Impact

- **aegis-vault/**: `queries.ts`, `PolicyPanel.tsx`, `MonitoredAppsPanel.tsx`, `DemoControlPanel.tsx`, `FirewallSetupSection.tsx` (refactor or replace), `demo-control.ts`, `demo-control-types.ts`
- **Oracle:** Optional `set_sql_monitor` in `SYS.aegis_demo_control` (v2.5.0) for luminaforge enable/disable; **no** change to `configure_aegis_soc` (AEGIS_APP allow-list stays disabled for ORA-47605 safety)
