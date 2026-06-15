## Context

LuminaForge **Transaction History** (`/transactions`) is Attack Point 2. Today `filterTransactions(ref)` runs:

```sql
SELECT id, user_id, type, amount, timestamp
FROM transactions
WHERE user_id = 1 AND type = '${ref}'
```

with raw concatenation in `vulnerable-queries.ts`. The UI hides the input inside `AdvancedSearchDrawer`. Seeded data includes 12 rows for `user_id = 1` and additional rows for users 3, 4, 5, 8, 9 that appear when the classic payload `x' OR user_id<>1 --` breaks out of the `type = '...'` string literal.

## Goals / Non-Goals

**Goals:**

- One obvious, always-visible search prompt at the top of Transaction History.
- Copy that sells “search the firm’s transaction ledger” while the backend remains scoped to the logged-in portfolio user until injection.
- Table clearly shows **User ID** (and existing columns) so presenters can point at leaked cross-client WIRE/SETTLE rows.
- Documented demo payload visible to the presenter (subtle monospace hint, same pattern as other attack points).
- Preserve `POST /api/transactions/filter` and no bind variables.

**Non-Goals:**

- Fixing the vulnerability or adding parameterized queries.
- New database tables/columns or changes to `Oracle_DB_Setup.sql` seed counts.
- Changing Market, Statement, or Bulk attack points.
- Aegis Vault UI changes.

## Decisions

1. **New component `TransactionHistoryLookup`** (replace `AdvancedSearchDrawer`) — Full-width glass search row: icon, input, **Search Ledger** CTA, expandable hint line. No collapse toggle; prompt is the page’s primary action.

2. **Copy & placeholder** — Title: “Institutional Transaction Lookup” (or “Transaction Ledger Search”). Placeholder: `Wire reference, transfer type, or counterparty code…`. Subtitle on page: clarify “Your portfolio activity” for benign use; lookup field marketing text can say “Search transaction records across the platform” (intentional mismatch for demo narrative).

3. **Keep SQL predicate shape** — Retain `user_id = 1 AND type = '${ref}'` so existing payload and firewall training steps stay valid. Alternative LIKE-based predicate rejected to avoid breaking presenter scripts and archived spec scenarios.

4. **API body** — Continue `{ ref: string }` JSON field; rename to `query` only if both UI and route are updated together (prefer **keep `ref`** to minimize churn).

5. **Results UX** — After search, banner: “Ledger results” with count; when `user_id` values other than `1` appear, optional subtle warning chip: “Multiple client IDs detected” (demo-only visual, not a security control).

6. **Single-flight** — Reuse `createSingleFlight` from existing drawer to prevent double-submit.

## Risks / Trade-offs

- **[Risk]** Misleading “platform-wide” copy confuses developers → **Mitigation**: code comments + SPEC note that behavior is intentionally vulnerable demo only.
- **[Risk]** Presenters forget payload → **Mitigation**: visible `DEMO_HINT` under input (same as today, updated styling).

## Migration Plan

1. Implement new component; wire `transactions/page.tsx`.
2. Delete `AdvancedSearchDrawer.tsx` when unused.
3. Update SPEC-luminaforge.md §5 point 2.
4. Manual verify: benign `BUY` → user 1 only; payload → rows for user_id 3+; Aegis shows luminaforge violation.

## Open Questions

- None for v1; optional “Multiple client IDs” chip can be skipped if it adds clutter.
