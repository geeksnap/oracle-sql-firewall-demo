## Context

`LuminaforgeFirewallControlCenter` stacks 3.1 / 3.2 / 3.3 vertically. Other Demo Control sections use a horizontal three-column body (`DemoControlSection`).

Oracle SQL Firewall stores monitor on/off (`STATUS` in `dba_sql_firewall_allow_lists`) separately from **block** (`BLOCK` column). Current package logic couples them:

| Action | Current behavior | Problem |
|--------|------------------|---------|
| `set_sql_monitor(TRUE)` | `ENABLE_ALLOW_LIST(..., block => FALSE)` | Clears block when turning monitor on |
| `set_sql_block(TRUE)` when monitor ON | `ENABLE_ALLOW_LIST(..., block => TRUE)` | Re-enters enable path; OK but redundant |
| `set_sql_block` when monitor OFF | `UPDATE_ALLOW_LIST_ENFORCEMENT` | Correct |

## Goals / Non-Goals

**Goals:**

- Title: **3. Luminaforge — SQL Firewall Control Center**
- `md:grid-cols-3` with column headers 3.1 / 3.2 / 3.3
- Independent toggles verified by dictionary: monitor ON + block ON, monitor ON + block OFF, monitor OFF + block ON (armed), monitor OFF + block OFF

**Non-Goals:**

- SOC (`AEGIS_APP`) posture changes
- New demo actions or Command NAV items

## Decisions

### 1. Column layout component

Refactor `LuminaforgeFirewallControlCenter` to mirror `DemoControlSection` column pattern:

```
┌─────────────────────────────────────────────────────────────┐
│ 3. Luminaforge — SQL Firewall Control Center                 │
│ User luminaforge                                             │
├──────────────────┬──────────────────┬──────────────────────┤
│ 3.1 Firewall     │ 3.2 Firewall info│ 3.3 Firewall setup   │
│ control          │                  │                      │
│ [4 buttons]      │ [3 view btns]    │ [capture + purge]    │
└──────────────────┴──────────────────┴──────────────────────┘
```

Reuse `ActionColumn`-style label (`text-[9px] uppercase`).

### 2. `set_sql_monitor` (v2.6.0)

Before enable, read `BLOCK` from allow-list row (default FALSE if no row).

```sql
IF p_enable THEN
  ENABLE_ALLOW_LIST(username, ENFORCE_ALL, block => l_current_block);
ELSE
  DISABLE_ALLOW_LIST(username);
END IF;
```

Disable monitor does not clear `BLOCK` in dictionary (Oracle keeps column; UI reads `sql_monitor_enabled` from `STATUS`).

### 3. `set_sql_block` (v2.6.0)

```sql
IF l_status = 'ENABLED' THEN
  UPDATE_ALLOW_LIST_ENFORCEMENT(username, block => p_block);
ELSIF l_has_row > 0 THEN
  UPDATE_ALLOW_LIST_ENFORCEMENT(...);
ELSE
  -- no row: ENABLE to create row with desired block (monitor becomes enabled — unavoidable without row)
  ENABLE_ALLOW_LIST(..., block => p_block);
END IF;
```

When monitor already enabled, **only** update block — preserves monitor ON.

### 4. Version bump

Package `2.6.0`; `expectedDbPackageVersion` in `build-info.json`.

## Risks / Trade-offs

- **[Risk] First-time luminaforge with no allow-list row — Enable block only** may enable monitor via `ENABLE_ALLOW_LIST` — document in demo script.
- **[Risk] Disable monitor while block armed** shows **SQL MONITOR OFF · BLOCK ON** in pills — already supported in `mapFirewallControlLabel`.

## Migration Plan

1. Deploy package v2.6.0 as SYS.
2. Update React component layout + title.
3. Manual matrix: all four combinations of monitor/block toggles.

## Open Questions

- None.
