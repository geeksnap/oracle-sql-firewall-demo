## Why

The right-rail **Firewall Policy** panel still reflects capture rows only, which diverges from **Monitored Apps** defence labels (allow-list + block + global firewall). Presenters also need clearer demo language (**SQL Monitor** instead of allow-list), a dedicated **Firewall Setup** strip for LuminaForge, and a fixed **detect-only** posture for the SOC application that cannot be toggled from Demo Control.

## What Changes

- **Firewall Policy (right rail):** Show per-user **SQL Firewall posture** aligned with Monitored Apps—global firewall, SQL Monitor (allow-list) on/off, block on/off, capture on/off—not capture `state` alone.
- **Demo Control §2:** Rename to **Security Operation Center** (user `AEGIS_APP`). Display fixed **DETECT · LOG ONLY** (or equivalent); remove any control that could enable block or SQL Monitor enforcement for SOC. Views/purge remain.
- **Aegis Vault monitored app:** `mapFirewallControlLabel` treats `AEGIS_APP` as **always log/detect, never block** in UI regardless of dictionary `BLOCK` flag (SOC allow-list stays disabled via DB grant).
- **Terminology:** User-visible **Allow-list** → **SQL Monitor** (buttons, labels, defence pills where applicable).
- **LuminaForge block toggle:** **Enable block SQL** / **Disable block SQL** work whether SQL Monitor is enabled or disabled (package uses `UPDATE_ALLOW_LIST_ENFORCEMENT` when monitor is off, `ENABLE_ALLOW_LIST` / update when on).
- **Demo Control LuminaForge layout:** New compact section **Firewall Setup** · *User luminaforge* — three columns: (1) Start/Stop SQL capture, (2) Enable block SQL, (3) Disable block SQL. Existing view/risk actions move to a second section **SQL Monitor & operations** (renamed labels).
- **DB package:** Extend `SYS.aegis_demo_control` (v2.4.0) with `set_sql_block` for Luminaforge-only block enforcement independent of monitor status; optional rename of display messages to “SQL Monitor”.

## Capabilities

### New Capabilities

- `sql-monitor-soc-ui`: Policy panel accuracy, SOC fixed detect-only UX, SQL Monitor naming, LuminaForge Firewall Setup layout, independent block SQL toggles.

### Modified Capabilities

- _(none under `openspec/specs/`)_

## Impact

- **aegis-vault/**: `PolicyPanel.tsx`, `queries.ts`, `types.ts`, `MonitoredAppsPanel.tsx`, `DemoControlPanel.tsx`, `DemoControlSection.tsx` (optional variant), `demo-control.ts`, `demo-control-types.ts`, `Header.tsx` copy.
- **Oracle:** `Oracle_DB_Demo_Control_Grant.sql` v2.4.0 — `set_sql_block` procedure; `build-info.json` expected package version.
- **LuminaForge app:** No changes (future).
