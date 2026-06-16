## 1. Market search input UX

- [x] 1.1 Replace Market Explorer `<textarea>` with single-line `<input type="text">` in `luminaforge/src/app/market/page.tsx`
- [x] 1.2 Add `autoComplete="off"`, `spellCheck={false}`, and non-resizable styling; keep Enter-to-search and monospace font
- [x] 1.3 Confirm no `<datalist>`, select, or suggestion dropdown is rendered in the Market search card

## 2. OCI WAF block alert

- [x] 2.1 In `search()`, when `res.status === 403`, call `window.alert("SQL injection detected by OCI WAF and blocked.")` before setting inline error
- [x] 2.2 Keep existing inline error message (e.g. "Blocked by OCI WAF") and empty results on **403**
- [x] 2.3 Ensure benign **200** responses do not trigger the alert

## 3. Verification

- [x] 3.1 Local: submit `' OR '1'='1` against LB-mirrored fetch path — expect alert + inline error on **403**
- [x] 3.2 Local: submit `ORCL` — expect **200**, results, no alert
- [x] 3.3 Deploy to demo VM and verify alert on LB URL (`168.110.61.146`) vs no alert on direct `:3001`
