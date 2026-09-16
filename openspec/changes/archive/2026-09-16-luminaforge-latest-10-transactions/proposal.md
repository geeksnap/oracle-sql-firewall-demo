## Why

The Transaction History demo shortcut filters the demo user's ledger by `timestamp >= SYSTIMESTAMP - 30 days`. Because the seed data carries fixed timestamps, it "ages out" of the 30-day window over time, so the button eventually returns zero rows and the demo function breaks until the seed data is re-seeded. Making the shortcut date-independent removes this recurring maintenance and keeps the demo reliable regardless of how old the seed data is.

## What Changes

- Relabel the Transaction History shortcut button from **Show all my last 30 days records** to **Show all my latest 10 transaction records**.
- Change the shortcut behavior from a 30-day time window to the most recent 10 transactions for the demo user, ordered newest-first, with **no date filter** (date-independent).
- Update the recent-transactions API contract to accept a row **limit** (default 10) instead of a **days** window, still using safe `oracledb` bind variables.
- **BREAKING** (internal API only): `POST /api/transactions/recent` request body changes from `{ days }` to `{ limit }`; there are no external consumers beyond the Transaction History page.

## Capabilities

### New Capabilities
<!-- None. This modifies existing behavior. -->

### Modified Capabilities
- `luminaforge-transaction-ledger-recent`: The shortcut requirement changes from a fixed 30-day time window to a date-independent "latest 10 transactions" query, with a new button label and a limit-based (not days-based) safe API contract. The "asset returned per row" requirement is retained.

## Impact

- **UI**: `luminaforge/src/components/TransactionHistoryLookup.tsx` — button label and the request payload it sends.
- **API**: `luminaforge/src/app/api/transactions/recent/route.ts` — parse a bounded `limit` (default 10) instead of `days`.
- **Data layer**: `luminaforge/src/lib/db/safe-queries.ts` — `listMyRecentTransactions` becomes limit-based, ordering newest-first and fetching the first N rows with no timestamp predicate.
- **No schema change**; no impact on the intentionally vulnerable `Search Ledger` input or the WAF-bypass demo hints.
