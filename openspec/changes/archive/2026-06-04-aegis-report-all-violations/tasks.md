## 1. Violation ingestion (server)

- [x] 1.1 Add per-fetch sequence suffix to `mapViolationRow` `id` when needed so duplicate dictionary rows are not collapsed
- [x] 1.2 Refactor `mergeWithBreakGlassViolations` — ordered merge up to `METRICS_VIOLATION_LIMIT`, no `Map` dedupe by `id`
- [x] 1.3 Remove `seenViolationIds` (and related) filtering from `lib/poller.ts`; emit `violations-snapshot` with full merged list; emit `violation` for newly observed rows (set diff vs previous snapshot)
- [x] 1.4 Remove attack-alert SQL-skeleton cooldown suppression of reporting (keep optional client banner debounce only)

## 2. Dashboard UI (Latest Threats + Live Violations)

- [x] 2.1 `page.tsx`: pass full `violations` ledger to Latest Threats and Live Violations (remove `slice(0, 12)`)
- [x] 2.2 `page.tsx`: on `violation` socket, prepend without dropping duplicate `id`s; trim to `METRICS_VIOLATION_LIMIT`
- [x] 2.3 Ensure Latest Threats and compact Live Violations tables scroll for long ledgers
- [x] 2.4 `ViolationsTable` / `ViolationsWithFullSql` / `LatestThreatsPanel`: hide **User** column on Latest Threats and Live Violations (`showUser={false}`)

## 3. Documentation and verification

- [x] 3.1 Update `aegis-vault/SPEC-aegis.md` — report-all violations policy; Latest Threats + Live Violations without **User** column
- [x] 3.2 `npm run build` in `aegis-vault` passes
- [x] 3.3 Manual: repeat same LuminaForge injection 3× → 3+ rows visible in Latest Threats and Live Violations (per Oracle logging)
