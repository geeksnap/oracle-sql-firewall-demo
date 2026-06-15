## Why

The LuminaForge Demo Control section title should say **SQL Firewall** explicitly, and sub-sections **3.1–3.3** should appear as **three columns** (matching other Demo Control cards) instead of a vertical stack. Presenters also need **SQL Monitor** and **Block SQL** to toggle **independently**; today `set_sql_monitor` forces `block => FALSE` on enable, and `set_sql_block` calls `ENABLE_ALLOW_LIST` when the monitor is on, which couples the two settings.

## What Changes

- **Rename** section title to **3. Luminaforge — SQL Firewall Control Center**.
- **Layout:** Single card with `grid-cols-3` — column 1 = **3.1 Firewall control**, column 2 = **3.2 Firewall info**, column 3 = **3.3 Firewall setup** (buttons stacked within each column).
- **Package v2.6.0:** Refine `set_sql_monitor` and `set_sql_block` so:
  - Enabling/disabling SQL Monitor preserves the current **block** flag in `dba_sql_firewall_allow_lists`.
  - Enabling/disabling Block SQL uses `UPDATE_ALLOW_LIST_ENFORCEMENT` when SQL Monitor is already **ENABLED** (does not re-call `ENABLE_ALLOW_LIST` with a forced block value).
- **UI labels** unchanged in 3.1 (four control buttons); Policy rail / Monitored Apps refresh after each action.

## Capabilities

### New Capabilities

- `luminaforge-sql-firewall-control-columns`: Title rename, three-column layout, independent monitor/block PL/SQL.

### Modified Capabilities

- _(none under `openspec/specs/`)_

## Impact

- **aegis-vault/**: `LuminaforgeFirewallControlCenter.tsx` (rename + column grid)
- **Oracle:** `Oracle_DB_Demo_Control_Grant.sql` v2.6.0 — `set_sql_monitor`, `set_sql_block` body changes; `build-info.json`
