## Context

- Demo Control §2 is labeled **Security Operation Center** but operates on **`AEGIS_APP`** (Aegis Vault DB user). Presenters confuse it with LuminaForge §3.
- LuminaForge demos require periodic **allow-list reset**: Oracle requires `DISABLE_ALLOW_LIST` then `DROP_ALLOW_LIST`; full re-capture also needs `STOP_CAPTURE` + `DROP_CAPTURE` before new `CREATE_CAPTURE` / `GENERATE_ALLOW_LIST` (see Oracle 26ai SQL Firewall docs).
- `buildMonitoredApps` in `queries.ts` emits two cards (`AEGIS_APP`, `luminaforge`). The UI override forces Aegis to **DETECT · LOG ONLY**, which clutters Policy/Monitored Apps when the story is “protect LuminaForge.”

## Goals / Non-Goals

**Goals:**

- Rename Demo Control §2 to **2. Aegis Vault - Security Operation Center**.
- Expose **Clear captured SQL rules** for **luminaforge** with confirm dialog and Output console feedback.
- Filter **Monitored Apps** and **Firewall Policy** to **luminaforge** only.

**Non-Goals:**

- Removing `AEGIS_APP` from violation queries, Threat Feed, or metrics that count SOC violations.
- Building the LuminaForge web app.
- Changing `configure_aegis_soc` or enabling allow-list on `AEGIS_APP`.

## Decisions

### 1. Package procedure `clear_firewall_policy(p_username, p_msg)`

**luminaforge only** (reject `AEGIS_APP` like other mutators).

Sequence (idempotent where possible):

1. If allow-list **ENABLED** → `DISABLE_ALLOW_LIST`
2. If allow-list row exists → `DROP_ALLOW_LIST`
3. If capture **running** → `STOP_CAPTURE`
4. If capture row exists → `DROP_CAPTURE` (deletes capture logs)

Message summarizes what was dropped. Bump `c_package_version` to **2.7.0**.

**Alternative considered:** `DROP_ALLOW_LIST` only — rejected because stale capture logs confuse “recapture” demos; dropping capture matches presenter intent (“start over”).

### 2. Demo action `clear-firewall-policy`

- Scope: **luminaforge** only.
- `isMutatingAction: true`; `needsConfirm` in UI with explicit warning (allow-list and capture logs removed).
- Placed in **§3.3 Firewall setup** (with capture start/stop), not §2—reset targets the victim app schema user.

### 3. Monitored Apps / Policy filter

In `buildMonitoredApps`, emit only `luminaforge`. Export helper `filterMonitoredAppsForDisplay(apps)` if Policy and Monitored Apps share the same list from poll snapshot—avoid duplicating filter logic.

**Alternative:** Hide via CSS — rejected; poll payload can stay full for future use but UI components only map luminaforge.

### 4. §2 rename only

Update `title` prop on `DemoControlSection` for §2; subtitle remains `User AEGIS_APP — SQL Monitor ON · Block SQL OFF (fixed detect-only)`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Presenter drops allow-list during live enforced demo | Confirm dialog; Output shows SQL executed |
| `DROP_CAPTURE` while capture running | Always `STOP_CAPTURE` first |
| Monitored Apps hides Aegis but violations still show AEGIS_APP in feed | Document in demo script; Threat Feed unchanged |
| Package not redeployed | Header version check; error text references v2.7.0+ |

## Migration Plan

1. Run updated `Oracle_DB_Demo_Control_Grant.sql` as SYS.
2. Deploy aegis-vault; verify header **db pkg 2.7.0**.
3. Demo flow: Clear captured SQL rules → Start capture → (benign traffic) → Stop capture → generate allow-list via DBA tool or future button.

## Open Questions

- None for v1. Optional follow-up: wire `GENERATE_ALLOW_LIST` as a separate Demo Control button (out of scope here).
