## Context

Aegis Vault dashboard metrics (`total_violations`, `luminaforge_violations`, `aegis_violations`) are derived in `buildMetrics()` from the violation rows returned by `fetchPollSnapshot(violationLimit)`. The poller and Demo Control refresh paths pass **50**, so counts never exceed 50 even when Oracle holds hundreds of rows. The fourth metrics card still displays **Last Poll** while the header already uses **Status Update** (SOC UI refresh).

## Goals / Non-Goals

**Goals:**

- Metrics cards reflect counts from up to **200** most recent `dba_sql_firewall_violations` rows for `AEGIS_APP` and `LUMINAFORGE`.
- Single shared constant drives the limit in poller + metrics refresh call sites.
- Presenter-visible label **Last Update** on the timestamp metric card.
- Document behavior in `SPEC-aegis.md`.

**Non-Goals:**

- Changing Latest Threats (12 rows) or Live Violations compact table limits.
- Renaming `last_poll_at` in JSON/socket payloads (optional follow-up).
- Separate aggregate SQL (`COUNT(*)`) — row fetch + in-memory filter is sufficient for demo scale.

## Decisions

### 1. Constant `METRICS_VIOLATION_LIMIT = 200` in `lib/db/queries.ts`

Export from queries module; default `fetchPollSnapshot` parameter becomes 200 for metrics-oriented calls. Poller and `demo-control/execute` pass this constant instead of `50`.

**Alternative:** Environment variable `METRICS_VIOLATION_LIMIT` — rejected for demo simplicity; constant matches explicit user request.

### 2. Keep `fetchViolations(limit)` API paths at their caller limits

`GET /api/violations` may still request smaller limits for tables; only paths that populate **dashboard metrics** use 200. `Math.max(limit, 50)` in `fetchViolations` becomes `Math.max(limit, METRICS_VIOLATION_LIMIT)` only where metrics snapshot is built — or poller always uses 200 for full snapshot while table endpoints pass explicit lower limits.

**Clarification:** `fetchPollSnapshot` is the metrics source; poller uses `METRICS_VIOLATION_LIMIT`. Violation list APIs that call `fetchPollSnapshot(50)` for table display should remain at 50/12 unless they share the same snapshot — verify `page.tsx` uses socket `metrics` from poller (200) and table uses separate capped list.

### 3. UI: label-only rename for Last Update

`MetricsCards.tsx`: `label: "Last Update"`. Continue binding to `metrics.last_poll_at`.

### 4. Display values are raw counts (no "200+" suffix)

Show actual count up to 200. If Oracle has more than 200 rows, counts reflect the latest 200 fetched (document in SPEC).

## Risks / Trade-offs

- **[Risk] Heavier poll query** → Mitigation: 200 rows × narrow columns is acceptable on demo PDB; monitor cycle time via existing `lastCycleMs` diagnostics.
- **[Risk] Metrics ≠ total dictionary row count** → Mitigation: SPEC states metrics are based on latest 200 violations, not global history.
- **[Risk] Stale "Last Poll" in tests/docs** → Mitigation: grep and update SPEC + MetricsCards only.

## Migration Plan

1. Ship constant + poller/demo-control call site updates.
2. Update MetricsCards label.
3. Update `SPEC-aegis.md`.
4. No database migration.

## Open Questions

- None.
