## Context

The Transaction History page (`luminaforge/src/components/TransactionHistoryLookup.tsx`) offers a safe shortcut button next to the intentionally vulnerable "Search Ledger" input. Today the button posts `{ days: 30 }` to `POST /api/transactions/recent`, which calls `listMyRecentTransactions(days)` in `luminaforge/src/lib/db/safe-queries.ts`. That query filters `WHERE user_id = :userId AND timestamp >= SYSTIMESTAMP - NUMTODSINTERVAL(:days, 'DAY')`.

Because the demo `transactions` rows are seeded with fixed timestamps, the 30-day window drifts past them as real time advances, so the button silently returns zero rows and the demo appears broken until the data is re-seeded. This design makes the shortcut date-independent.

## Goals / Non-Goals

**Goals:**
- Make the shortcut return the demo user's 10 most recent transactions regardless of seed-data age.
- Keep the query safe and parameterized (bind variables only), matching the existing security posture.
- Preserve the existing `asset`-per-row behavior and the "Ledger results" table wiring.
- Update only the button label and its request payload on the UI side.

**Non-Goals:**
- No change to the vulnerable "Search Ledger" input, its SQL-injection demo, or the WAF-bypass hint rows.
- No database schema or seed-data changes.
- No change to `POST /api/transactions/filter`.

## Decisions

- **Latest-N via `FETCH FIRST :limit ROWS ONLY`, ordered `timestamp DESC`.** Ordering newest-first then fetching the first N is the natural "latest transactions" semantics and is date-independent. Ordering by `timestamp` (not `id`) keeps behavior intuitive even if rows were inserted out of chronological order; `id DESC` is an acceptable tiebreaker.
  - *Alternative considered:* keep a days window but widen it (e.g., 3650 days). Rejected — still time-relative and can break again; doesn't express the requested "latest 10" intent.
- **API contract changes from `{ days }` to `{ limit }`, default 10, bounded (1–100).** Bounding avoids unbounded result sets while a bind variable keeps it injection-safe. The route keeps its resilient shape: bad/empty body falls back to the default.
  - *Alternative considered:* hardcode 10 in the query with no client input. Rejected — a bounded bind keeps the endpoint flexible and the SQL still parameterized; the client simply omits or sends `limit: 10`.
- **`listMyRecentTransactions` signature becomes `(limit = 10, userId = DEMO_USER_ID)`.** The mapping of returned columns (including `asset`) is unchanged.

## Risks / Trade-offs

- **Internal API body shape changes (`days` → `limit`).** → The only caller is the Transaction History page, updated in the same change; no external consumers exist.
- **Callers still sending `{ days }`.** → The route ignores unknown fields and falls back to the default limit, so stale calls degrade gracefully to "latest 10" rather than erroring.
- **`timestamp DESC` with equal timestamps.** → Add `id DESC` as a deterministic tiebreaker so ordering is stable.

## Migration Plan

1. Update the data-layer query and API route to be limit-based.
2. Update the button label and payload in the component.
3. No data migration required; rollback is reverting the three files.
