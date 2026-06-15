## Context

- **SOC user `AEGIS_APP`** must keep SQL Monitor **disabled in the dictionary** (`DISABLE_ALLOW_LIST` via `configure_aegis_soc`) so Demo Control PL/SQL is not ORA-47605-blocked.
- Product narrative: Aegis Vault is **always detecting/logging**, **never blocking**—a presenter-facing rule, not a LuminaForge toggle.
- **LuminaForge** remains fully demo-driven via Demo Control and `set_sql_block` / capture procedures (v2.4.0).

## Goals / Non-Goals

**Goals:**

- `buildMonitoredApps` / Policy rail: for `AEGIS_APP`, force `sql_monitor_enabled: true`, `block_sql: false` when global FW on (override dictionary for display only).
- SOC Demo Control: only view violations + purge.
- Single LuminaForge section with three labeled sub-rows (3.1–3.3).
- `sql-monitor-enable` + `sql-monitor-disable` for luminaforge.

**Non-Goals:**

- Enabling SQL Monitor on `AEGIS_APP` in the database.
- Building the LuminaForge web app.
- New Command NAV items (unless added in a follow-up).

## Decisions

### 1. SOC posture = presentation override

In `buildOne` for `AEGIS_APP`, after reading allow-list row:

```ts
if (id === "AEGIS_APP" && globalFirewallEnabled) {
  sql_monitor_enabled = true;
  block_sql = false;
  // label from mapFirewallControlLabel(..., "AEGIS_APP") → DETECT · LOG ONLY
}
```

Dictionary may still show `STATUS=DISABLED`; UI copy clarifies “detect path” without enabling allow-list on SOC.

**Alternative:** `ENABLE_ALLOW_LIST` for AEGIS_APP with block false — rejected (breaks Demo Control).

### 2. SOC Demo Control actions

| Keep | Remove |
|------|--------|
| View violations | View SQL Monitor status |
| Clear violation logs | View capture status |

### 3. LuminaForge — Firewall Control Center layout

New component `LuminaforgeControlCenter` (or extend `DemoControlPanel`):

```
§3 Luminaforge — Firewall Control Center
  User luminaforge

  3.1 Firewall control    [4 buttons in a row or 2×2 grid]
    Enable SQL Monitoring | Disable SQL Monitoring
    Enable block SQL      | Disable block SQL

  3.2 Firewall info       [3 view buttons]
    View violations | View capture status | View SQL Monitor status

  3.3 Firewall setup      [3 buttons]
    Start SQL capture | Stop SQL capture | Clear violation logs
```

Remove: separate `FirewallSetupSection` at top level; remove “Stop SQL Monitor enforcement” from risk column (moved to 3.1 as **Disable SQL Monitoring**).

**Note:** “Stop SQL Monitor enforcement” ≡ `sql-monitor-disable`; “Enable SQL Monitoring” ≡ new `sql-monitor-enable`.

### 4. Package `set_sql_monitor` (v2.5.0)

```sql
PROCEDURE set_sql_monitor(p_username, p_enable, p_msg);
-- Reject AEGIS_APP
-- p_enable TRUE  → ENABLE_ALLOW_LIST(..., block => FALSE) or START if row exists disabled
-- p_enable FALSE → DISABLE_ALLOW_LIST
```

Luminaforge `sql-monitor-enable` / `sql-monitor-disable` call this.

`block-on` / `block-off` continue using `set_sql_block`.

### 5. Remove redundant luminaforge actions from UI

Drop duplicate purge from old risk column if merged into 3.3 only once.

## Risks / Trade-offs

- **[Risk] UI says Monitor ON but `view-sql-monitor` as SYS shows DISABLED for AEGIS_APP** — Mitigation: SOC section no longer exposes those views; optional footnote on Monitored Apps: “SOC detect path (allow-list off in DB for Demo Control).”
- **[Risk] Enable SQL Monitoring on luminaforge enables allow-list** — Expected; presenter uses 3.1 toggles explicitly.

## Migration Plan

1. DB package v2.5.0 + re-grant as SYS.
2. Query override + Demo Control layout.
3. Remove `FirewallSetupSection` usage for luminaforge-only path; delete file if unused.
4. `npm run build`; manual demo script.

## Open Questions

- Sub-section labels: use exact user strings “3.1 Firewall Control” vs “3.1 — Firewall control” (implementation: small caps labels matching user spec).
