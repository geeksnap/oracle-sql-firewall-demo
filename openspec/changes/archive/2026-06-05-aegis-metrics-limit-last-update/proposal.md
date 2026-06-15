## Why

During heavy LuminaForge attack demos, dashboard metric cards (Total Violations, LuminaForge Hits, Aegis Hits) plateau at **50** because `fetchPollSnapshot` only loads the latest 50 `dba_sql_firewall_violations` rows before `buildMetrics` counts them. Presenters cannot see realistic cumulative hit counts. The fourth metric card still says **Last Poll**, which conflicts with the header’s **Status Update** terminology adopted in the SOC UI refresh.

## What Changes

- Raise the violation fetch ceiling used for **metrics aggregation** from 50 to **200** so Total Violations, LuminaForge Hits, and Aegis Hits reflect up to 200 recent dictionary rows (per monitored users).
- Introduce a shared constant (e.g. `METRICS_VIOLATION_LIMIT = 200`) used by the status poller and post–Demo Control refresh paths that feed metrics.
- **UI copy:** Rename the metrics card label **Last Poll** → **Last Update** (timestamp of the last successful status refresh). Internal field `last_poll_at` MAY remain for API stability.
- Update `aegis-vault/SPEC-aegis.md` to document the 200-row metrics ceiling and **Last Update** label.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `soc-ui-refresh`: Extend dashboard metrics requirements — counts capped at 200 fetched rows; fourth card labeled **Last Update**.

## Impact

- **aegis-vault/**: `lib/db/queries.ts` (`fetchPollSnapshot` default/limit, `buildMetrics`), `lib/poller.ts`, `src/app/api/demo-control/execute/route.ts`, `src/components/MetricsCards.tsx`, `SPEC-aegis.md`.
- **Database:** Single query still uses `ROWNUM <= :limit`; slightly larger result set on busy demos (acceptable for presenter PDB).
- **LuminaForge:** No changes. Latest Threats / Live Violations table row limits (12 / 100 client buffer) unchanged unless separately requested.
