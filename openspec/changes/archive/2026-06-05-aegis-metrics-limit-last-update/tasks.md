## 1. Metrics fetch limit

- [x] 1.1 Add `METRICS_VIOLATION_LIMIT = 200` in `aegis-vault/lib/db/queries.ts` and use as default for `fetchPollSnapshot` when building dashboard metrics
- [x] 1.2 Update `aegis-vault/lib/poller.ts` to pass `METRICS_VIOLATION_LIMIT` instead of `50`
- [x] 1.3 Update `aegis-vault/src/app/api/demo-control/execute/route.ts` post-action refresh to use `METRICS_VIOLATION_LIMIT`

## 2. Dashboard UI copy

- [x] 2.1 Rename metrics card label **Last Poll** → **Last Update** in `aegis-vault/src/components/MetricsCards.tsx`

## 3. Documentation and verification

- [x] 3.1 Update `aegis-vault/SPEC-aegis.md` — metrics ceiling 200, **Last Update** card label
- [x] 3.2 `npm run build` in `aegis-vault` passes
- [x] 3.3 Manual: after repeated LuminaForge attacks, Total Violations / LuminaForge Hits can exceed 50 (up to 200); fourth card reads **Last Update**
