## Why

Transaction History needs a **benign, one-click path** for presenters to populate **Ledger results** with the demo user’s recent activity before running SQL injection demos. The ledger table also lacks **asset context** (symbol/name), which makes BUY/SELL rows harder to interpret during live demos.

## What Changes

- Add button **“Show all my last 30 days records”** on Transaction History that loads `user_id = 1` transactions from the last 30 days into the **Ledger results** table (no injection required).
- Add **`asset`** column to `luminaforge.transactions` (schema + seed data + reset script) and display **Asset** in the ledger table for every row.
- New **safe** API route using `oracledb` bind variables for the 30-day query (contrast with vulnerable `/api/transactions/filter`).
- Extend vulnerable `filterTransactions` SELECT to include `asset` so injection results also show asset when present.
- Update `luminaforge/SPEC-luminaforge.md` and transaction-history OpenSpec delta.

## Capabilities

### New Capabilities

- `luminaforge-transaction-ledger-recent`: Safe 30-day ledger fetch for demo user and UI button wiring.

### Modified Capabilities

- `luminaforge-transaction-history-prompt`: Ledger table columns and benign “show my records” affordance alongside institutional lookup.

## Impact

- `Oracle_DB_Setup.sql` — `transactions.asset` column + seeded values for user_id 1 rows
- `luminaforge/scripts/reset-demo-data.sql` — backfill asset on re-seed
- `luminaforge/src/lib/db/safe-queries.ts` (new) + `vulnerable-queries.ts`
- `luminaforge/src/app/api/transactions/recent/route.ts` (new)
- `luminaforge/src/components/TransactionHistoryLookup.tsx`, `transactions/page.tsx`
- `luminaforge/SPEC-luminaforge.md`
