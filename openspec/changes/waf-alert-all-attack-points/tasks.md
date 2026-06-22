## 1. Shared WAF alert helper

- [x] 1.1 Add `luminaforge/src/lib/waf-block-alert.ts` with `WAF_BLOCK_ALERT_MESSAGE`, `alertIfWafBlocked()`, and `wafBlockErrorMessage()`
- [x] 1.2 Refactor `market/page.tsx` to use the shared helper instead of inline `window.alert`

## 2. WAF alert on Attack Points 2–4

- [x] 2.1 Update `TransactionHistoryLookup.tsx` to check `res.status === 403`, show WAF alert, and set inline error
- [x] 2.2 Update `statement/page.tsx` to check `res.status === 403`, show WAF alert, and set inline error
- [x] 2.3 Update `BulkActionPanel.tsx` to check `res.status === 403`, show WAF alert, and set inline error

## 3. Plain fixed text inputs

- [x] 3.1 Verify Market search remains fixed single-line `<input type="text">` with `autoComplete="off"` (adjust styling only if needed)
- [x] 3.2 Replace Bulk `Batch Execution Note` `<textarea>` with fixed single-line `<input type="text">` and `autoComplete="off"`
- [x] 3.3 Add `autoComplete="off"` to Transaction History ledger input and Statement tax ID input

## 4. Verification

- [x] 4.1 Run `npm run build` in `luminaforge`
- [x] 4.2 Verify canonical payloads return **403** + alert on LB URL for all four attack points; benign values do not alert
- [x] 4.3 Deploy to demo VM and smoke-test presenter flow on LB vs direct `:3001`
