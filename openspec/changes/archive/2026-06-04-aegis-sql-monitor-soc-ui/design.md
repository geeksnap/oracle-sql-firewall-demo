## Context

Aegis Vault polls `dba_sql_firewall_allow_lists`, `dba_sql_firewall_captures`, and `dba_sql_firewall_status`. **Monitored Apps** derives defence labels via `mapFirewallControlLabel`. **PolicyPanel** currently maps only capture rows (`FirewallPolicy.state` = capture STATUS), so it shows misleading green “ENABLED” while SQL Monitor is off or block is armed.

SOC user `AEGIS_APP` must keep allow-list disabled (`configure_aegis_soc`) so Demo Control PL/SQL is not ORA-47605-blocked. Product intent: SOC **detects and logs** violations for the dashboard; it does **not** block its own session.

LuminaForge demos need capture + block toggles in a presenter-friendly **Firewall Setup** row. Today `set_block` always calls `ENABLE_ALLOW_LIST`, which forces `STATUS=ENABLED`—unsuitable for “block flag only while SQL Monitor is off.”

## Goals / Non-Goals

**Goals:**

- Right-rail policy cards show: app name, defence label (same logic as Monitored Apps), capture ON/OFF, SQL Monitor ON/OFF, block ON/OFF.
- Section 2 title **Security Operation Center**; read-only badge **DETECT · LOG ONLY**; no block/monitor toggles for AEGIS_APP.
- `AEGIS_APP` defence pill always **DETECT · LOG ONLY** (fixed in `mapFirewallControlLabel`).
- LuminaForge **Firewall Setup** 3-column grid; block enable/disable via new `set_sql_block(username, block)`.
- Rename user-facing “allow-list” strings to **SQL Monitor**.

**Non-Goals:**

- Changing LuminaForge application code.
- Re-enabling SQL Monitor on AEGIS_APP from the UI.
- Replacing `dba_sql_firewall_*` views or socket protocol.

## Decisions

### 1. Unified `FirewallPosture` model for Policy + Monitored Apps

Add helper `buildFirewallPosture(globalEnabled, allowList?, capture?)` returning:

| Field | Source |
|-------|--------|
| `defence_label` | `mapFirewallControlLabel` (with AEGIS_APP override) |
| `sql_monitor_enabled` | `allowList.status === 'ENABLED'` |
| `block_sql` | `allowList.block` |
| `capture_enabled` | `capture.state === 'ENABLED'` |

`PolicyPanel` receives `MonitoredAppStatus[]` or posture array from poll snapshot instead of raw `FirewallPolicy[]` only.

**Alternative:** Duplicate query logic in PolicyPanel — rejected.

### 2. AEGIS_APP fixed detect-only (UI + label map)

In `mapFirewallControlLabel`, if `allowList.username === 'AEGIS_APP'` (or caller passes `isSocUser: true`):

```ts
return { label: "DETECT · LOG ONLY", tone: "warn", defence_status: "enforced-log" };
```

When global firewall off → still **FIREWALL OFF**. Demo Control §2: static info line, no `block-on` / `allow-list-disable` / `capture-*` for `aegis` scope.

**DB:** Keep `configure_aegis_soc`; do not add SOC block procedures.

### 3. `set_sql_block` (package v2.4.0)

```sql
PROCEDURE set_sql_block(p_username, p_block, p_msg);
-- Reject AEGIS_APP
-- If allow-list STATUS = ENABLED: ENABLE_ALLOW_LIST(..., block => p_block)
-- Else: UPDATE_ALLOW_LIST_ENFORCEMENT(username, block => p_block)
-- Optionally if no allow-list row: CREATE minimal path or UPDATE only after implicit row
```

Demo actions: `sql-block-on` / `sql-block-off` (luminaforge only), replacing ambiguous `block-on`/`block-off` in Firewall Setup or mapping existing actions to this procedure.

`block-on`/`block-off` in API redirect to `set_sql_block` for luminaforge.

### 4. LuminaForge Demo Control structure

```
§3a Firewall Setup — User luminaforge
  [3-col grid, no protect header row]
  Col1: Start SQL capture | Stop SQL capture
  Col2: Enable block SQL  (success)
  Col3: Disable block SQL (info/danger)

§3b LuminaForge SQL Monitor & operations
  (existing view/risk layout; labels use SQL Monitor)
  - Stop SQL Monitor enforcement (was Stop allow-list)
  - View SQL Monitor status (was View allow-list)
```

Remove capture/block from old §3 protect header stack.

### 5. Terminology sweep

| Before | After |
|--------|--------|
| Allow-list | SQL Monitor |
| Stop allow-list enforcement | Stop SQL Monitor |
| View allow-list status | View SQL Monitor status |
| ALLOW-LIST OFF (pill) | SQL MONITOR OFF |

Internal enum names (`allow-list-off`) may remain for stability; user-visible strings change.

## Risks / Trade-offs

- **[Risk] `UPDATE_ALLOW_LIST_ENFORCEMENT` when no allow-list row** → Mitigation: if no row, call `CREATE_CAPTURE` path not needed; `ENABLE_ALLOW_LIST` with `block FALSE` to create row then update, or document “run setup script first.”
- **[Risk] Policy panel height** → Mitigation: compact card (single line defence + 3 booleans).
- **[Risk] Package not upgraded** → Mitigation: header `db pkg 2.4.0` check; error text on `set_sql_block` missing.

## Migration Plan

1. Ship DB package v2.4.0; user runs `@Oracle_DB_Demo_Control_Grant.sql`.
2. Update `queries.ts` + `PolicyPanel` + poll snapshot type.
3. Refactor `DemoControlPanel` LuminaForge sections and SOC rename.
4. Manual demo script: verify Policy rail matches Monitored Apps after each toggle.

## Open Questions

- Whether centre **Policy** nav page should use the same posture cards (default: yes, reuse component).
