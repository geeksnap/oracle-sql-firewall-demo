## Why

Presenters running repeated LuminaForge attack demos expect **every** SQL Firewall trigger to appear in **Latest Threats** and **Live Violations**. Today the stack collapses or hides repeats: the poller tracks `seenViolationIds` and skips re-reporting, `mergeWithBreakGlassViolations` dedupes by `id`, the client caps lists at 12 visible rows / 50 merged rows / 100 socket rows, and attack-alert cooldown suppresses follow-on signals for the same endpoint. That makes the SOC panels under-count activity during burst demos.

## What Changes

- **Violation ingestion:** Stop eliminating duplicate or re-seen firewall log rows in the status-update pipeline. Each row returned from `dba_sql_firewall_violations` (within the metrics fetch window) SHALL be represented in `violations-snapshot` and MAY emit a `violation` event without `seenViolationIds` filtering.
- **Row identity:** Ensure each Oracle log occurrence gets a stable, unique `id` (username + SQL identity + `occurred_at` + fetch sequence when needed) so legitimate duplicate log lines are not collapsed in merge maps.
- **Merge / fetch window:** Align break-glass + dictionary merge limit with `METRICS_VIOLATION_LIMIT` (200) — not 50.
- **Client ledger:** Latest Threats and Live Violations SHALL display the **full** in-memory violation list (up to 200), scrollable — remove the hard `slice(0, 12)` presentation cap. Socket `violation` handler SHALL append rows without dropping prior rows that share an `id` when the server sends distinct occurrences.
- **Attack-alert cooldown:** Remove or disable the 3-minute per-SQL-skeleton suppression so globe/banner feedback can fire for each reported trigger (optional: keep banner debounce separate from ledger completeness).
- **UI columns:** Remove the **User** column from **Latest Threats** and **Live Violations** tables (presenter-facing labels: Time, Source App, Type, and Action/SQL as today for Latest Threats). Oracle `username` remains in data/API for mapping only.
- **SPEC / docs:** Update `SPEC-aegis.md` — report-all policy for Latest Threats and Live Violations; note purge + `resetPollerState` still clears session state after demo reset.

## Capabilities

### New Capabilities

- `aegis-violation-ingestion`: Poller, merge, socket payloads, and violation `id` strategy — no duplicate elimination in the reporting path.

### Modified Capabilities

- `aegis-dashboard-threats-height`: Latest Threats shows all violations in the ledger (up to fetch limit), not a 12-row cap; no **User** column.
- `aegis-live-violations-compact`: Live Violations shows the same complete ledger with internal scroll; no **User** column.

## Impact

- **aegis-vault/**: `lib/poller.ts`, `lib/break-glass-store.ts`, `lib/db/queries.ts` (`mapViolationRow` / merge), `src/app/page.tsx`, `LatestThreatsPanel.tsx`, `ViolationsTable.tsx` (if row counts / scroll), `SPEC-aegis.md`.
- **Database:** Read-only; still bounded by `METRICS_VIOLATION_LIMIT` (200) per status update.
- **LuminaForge:** No changes.
