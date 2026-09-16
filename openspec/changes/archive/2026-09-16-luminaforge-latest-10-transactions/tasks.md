## 1. Data layer

- [x] 1.1 Change `listMyRecentTransactions` in `luminaforge/src/lib/db/safe-queries.ts` to signature `(limit = 10, userId = DEMO_USER_ID)`
- [x] 1.2 Replace the query with a date-independent latest-N: `SELECT id, user_id, type, amount, asset, timestamp FROM transactions WHERE user_id = :userId ORDER BY timestamp DESC, id DESC FETCH FIRST :limit ROWS ONLY`, binding `userId` and `limit`
- [x] 1.3 Keep the existing row mapping (including `asset`) unchanged

## 2. API route

- [x] 2.1 In `luminaforge/src/app/api/transactions/recent/route.ts`, parse `limit` (default 10) instead of `days`, bounding it to 1–100 and flooring non-integers
- [x] 2.2 Fall back to the default limit on empty/invalid body; call `listMyRecentTransactions(limit)`
- [x] 2.3 Preserve the resilient `{ rows, error }` response shape

## 3. UI

- [x] 3.1 In `luminaforge/src/components/TransactionHistoryLookup.tsx`, rename the button label to **Show all my latest 10 transaction records** (and its loading state text as needed)
- [x] 3.2 Change the shortcut handler to POST `{ limit: 10 }` (rename `showLast30Days` to reflect latest-10 intent)
- [x] 3.3 Leave the vulnerable "Search Ledger" input, demo hint, and WAF-bypass hint row untouched

## 4. Verify

- [x] 4.1 With seed data older than 30 days, clicking the button returns up to 10 newest rows in **Ledger results**
- [x] 4.2 Confirm the recent-transactions SQL uses bind variables only (no string concatenation)
- [x] 4.3 `openspec validate luminaforge-latest-10-transactions --strict` passes
