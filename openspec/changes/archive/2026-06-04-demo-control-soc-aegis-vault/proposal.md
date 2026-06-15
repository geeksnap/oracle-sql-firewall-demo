## Why

Demo narrators need clearer labeling for the SOC Demo Control section (it is the **Aegis Vault** presenter account, not a generic SOC), a safe way to **reset LuminaForge SQL Firewall policy** between runs (drop allow-list / capture so training can start over), and a **single-app focus** in Monitored Apps and Firewall Policy—LuminaForge is the attack target; Aegis Vault is the operator console, not a monitored victim app card.

## What Changes

- **Demo Control §2:** Rename title from **2. Security Operation Center** to **2. Aegis Vault - Security Operation Center** (subtitle and buttons unchanged unless noted below).
- **Demo Control:** Add a **Clear captured SQL rules** action (luminaforge) that drops the allow-list (and optionally capture logs) so presenters can run capture → `GENERATE_ALLOW_LIST` again. Requires confirmation; implemented via `SYS.aegis_demo_control` (package bump).
- **Monitored Apps panel:** Show **LuminaForge only**—remove the Aegis Vault / `AEGIS_APP` card.
- **Firewall Policy panel (right rail):** Show **LuminaForge only**—same filter as Monitored Apps.
- **Unchanged:** Threat Feed and violation polling may still include `AEGIS_APP` rows; global Demo Control §1; LuminaForge §3 layout; SOC `configure_aegis_soc` (allow-list disabled for `AEGIS_APP`).

## Capabilities

### New Capabilities

- `demo-control-soc-aegis-vault`: SOC section rename, luminaforge allow-list/capture reset button, luminaforge-only Monitored Apps and Firewall Policy.

### Modified Capabilities

- _(none under `openspec/specs/`)_

## Impact

- **aegis-vault/**: `DemoControlPanel.tsx`, `LuminaforgeFirewallControlCenter.tsx`, `queries.ts`, `PolicyPanel.tsx`, `MonitoredAppsPanel.tsx`, `Sidebar.tsx` (monitoring copy), `demo-control.ts`, `demo-control-types.ts`
- **Oracle:** `Oracle_DB_Demo_Control_Grant.sql` — new `clear_firewall_policy` (or equivalent) procedure; version bump (e.g. v2.7.0) and `build-info.json`
