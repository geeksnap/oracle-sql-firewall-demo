## 1. Transaction History lookup UI

- [x] 1.1 Create `TransactionHistoryLookup.tsx` — always-visible hero search (title, input, Search Ledger button, demo payload hint, single-flight submit)
- [x] 1.2 Wire `transactions/page.tsx` to use the new component; remove `AdvancedSearchDrawer` import
- [x] 1.3 Delete `AdvancedSearchDrawer.tsx` when unreferenced
- [x] 1.4 Style prompt to match luxury fintech (glass panel, gold accent, consistent with Market search bar)

## 2. Results presentation

- [x] 2.1 Update results header copy (“Ledger results” / count) after search
- [x] 2.2 Ensure **User ID** column remains prominent; optional “multiple client IDs” indicator when any row has `user_id !== 1`

## 3. Backend (verify unchanged contract)

- [x] 3.1 Confirm `filterTransactions` in `vulnerable-queries.ts` still uses raw concat `user_id = 1 AND type = '${ref}'` (update route comments only if needed)
- [x] 3.2 Confirm `POST /api/transactions/filter` still accepts `{ ref }` and returns `{ rows, error? }`

## 4. Documentation

- [x] 4.1 Update `luminaforge/SPEC-luminaforge.md` Attack Point 2 — primary ledger lookup prompt, all-users exfiltration outcome

## 5. Verification

- [x] 5.1 `npm run build` in `luminaforge` passes
- [x] 5.2 Manual: benign `BUY` → only user_id 1 rows
- [x] 5.3 Manual: payload `x' OR user_id<>1 --` → rows for user_id 3, 4, 5, 8, 9 visible; Aegis Vault logs luminaforge violation within one poll cycle
