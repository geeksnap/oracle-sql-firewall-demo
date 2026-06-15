## Context

Aegis Vault ingests `dba_sql_firewall_violations` on a periodic status update (`lib/poller.ts`). Several layers reduce what presenters see:

| Layer | Current behavior | Effect |
|--------|------------------|--------|
| `seenViolationIds` | Skips `violation` emits after first sight of `id` | Re-seen rows silent on socket |
| Bootstrap cycle | Skips all `newViolations` on first poll | No per-row events on connect |
| `attackAlertCooldowns` | 3 min per SQL skeleton | Suppresses `attack-alert` repeats |
| `mergeWithBreakGlassViolations(..., 50)` | Map by `id`, cap 50 | Drops rows + collapses same `id` |
| `page.tsx` | `slice(0, 12)` to panels; `slice(0, 100)` client; dedupe on `violation` by `id` | UI shows ≤12; duplicates replaced |

`mapViolationRow` already builds `id` as `` `${sqlKey}|${occurred}` `` so distinct Oracle timestamps should be distinct. Collisions only if merge Map or client dedupe removes them.

## Goals / Non-Goals

**Goals:**

- Latest Threats and Live Violations reflect **every** violation row in the current fetch window (up to `METRICS_VIOLATION_LIMIT`).
- Repeated attacks (new `occurred_at` or duplicate dictionary rows) all appear in the ledger.
- Status-update snapshot and real-time `violation` events do not filter on `seenViolationIds`.

**Non-Goals:**

- Unbounded in-memory history beyond `METRICS_VIOLATION_LIMIT` (200).
- Changing SQL Firewall logging in Oracle.
- Full Threat Feed nav (retired); Dashboard + right rail only.

## Decisions

### 1. Remove `seenViolationIds` gating for reporting

Delete the skip loop that prevents rows from entering `newViolations` / re-emit logic. On each poll after bootstrap, emit `violation` for every row in the current snapshot that was not in the **previous** snapshot (set diff by `id`), OR emit all rows every poll if simpler for demo — **preferred: set diff** so websocket volume stays bounded while snapshot always carries full list.

**Alternative:** Emit every row every second — rejected (noisy); snapshot full + diff emit for new ids only, but snapshot list never dedupes rows.

### 2. `violations-snapshot` carries full merged list (200)

`mergeWithBreakGlassViolations(db, METRICS_VIOLATION_LIMIT)` — replace `Map` dedupe with ordered concat: break-glass first, then DB rows, sort by `occurred_at` desc, `slice(0, limit)` without collapsing duplicate `id`s. If same `id` appears twice, keep both (only if id generation guarantees uniqueness per occurrence).

### 3. Unique `id` per fetched row

When mapping Oracle rows, append `` `|${rowIndex}` `` (0-based within poll result) to `id` so flush duplicates with identical timestamp/SQL remain distinct in the UI.

### 4. Client state: full ledger to both panels

- `violations-snapshot` → `setViolations(snapshot)` (preserve `detected_at` where already set).
- `violation` event → prepend without `filter(id !==)`; trim tail to `METRICS_VIOLATION_LIMIT`.
- Pass `violations` (not `slice(0, 12)`) to `LatestThreatsPanel` and compact `ViolationsTable`.

### 5. Hide User column on dashboard violation tables

Add `showUser?: boolean` to `ViolationsTable` / `ViolationsWithFullSql` (default `false` for dashboard paths). **Latest Threats** and **Live Violations** pass `showUser={false}` so presenters see Source App + Type (and Action / Full SQL on Latest Threats) without redundant `AEGIS_APP` / `luminaforge` username cells.

### 6. Attack-alert cooldown

Remove `attackAlertCooldowns` block (or reduce to console-only). Each new `violation` for `luminaforge` may trigger `attack-alert` + globe flash (existing client debounce on banner 60s can stay).

### 7. `resetPollerState` after purge

Keep purge → `resetPollerState()` so post-demo sessions start clean; document that this clears session ledger, not Oracle history.

## Risks / Trade-offs

- **[Risk] Larger DOM lists** → Mitigation: scroll inside panels; max 200 rows.
- **[Risk] More socket traffic** → Mitigation: diff-based `violation` emit; full list on `violations-snapshot` only once per poll.
- **[Risk] Globe flashes frequently** → Mitigation: acceptable for demo; optional client throttle later.

## Migration Plan

1. Backend: poller + merge + id suffix.
2. Frontend: page.tsx props + scroll styles.
3. SPEC update.
4. Manual: run same injection 5× → 5 rows in Latest Threats / Live Violations (subject to Oracle logging).

## Open Questions

- None.
