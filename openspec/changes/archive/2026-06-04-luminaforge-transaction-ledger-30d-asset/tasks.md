## 1. Database schema and seed data

- [x] 1.1 Add `asset VARCHAR2(40)` to `transactions` in `Oracle_DB_Setup.sql`; populate asset on all `INSERT INTO transactions` rows (symbols for user_id 1, sensible labels for cross-client rows)
- [x] 1.2 Update `luminaforge/scripts/reset-demo-data.sql` to set/backfill `asset` on re-seeded transaction rows

## 2. Backend

- [x] 2.1 Add `lib/db/safe-queries.ts` with `listMyRecentTransactions(days)` — binds for `user_id = 1` and 30-day window
- [x] 2.2 Add `POST /api/transactions/recent` returning `{ rows }` with asset column
- [x] 2.3 Extend `filterTransactions` SELECT in `vulnerable-queries.ts` to include `asset` (concat path unchanged)

## 3. UI

- [x] 3.1 Add **Show all my last 30 days records** button to `TransactionHistoryLookup.tsx`; wire to recent API and `onResults`
- [x] 3.2 Add **Asset** column to ledger table in `transactions/page.tsx`; extend `TxRow` type with `asset` / `ASSET`
- [x] 3.3 On 30-day load success, set ledger header to **Ledger results** and clear prior error state

## 4. Documentation

- [x] 4.1 Update `luminaforge/SPEC-luminaforge.md` Transaction History — 30-day button + Asset column

## 5. Verification

- [x] 5.1 `npm run build` in `luminaforge` passes
- [x] 5.2 Manual: **Show all my last 30 days records** → Ledger results with user_id 1 only, assets visible, ~12 rows
- [x] 5.3 Manual: Search Ledger + injection still works; Asset column shown when DB has values
