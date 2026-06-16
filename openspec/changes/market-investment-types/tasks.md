## 1. Market investment domain data

- [x] 1.1 Replace Market demo catalog fixtures/seed data from luxury assets to investment instruments across stocks, bonds, ETFs, crypto, and metals.
- [x] 1.2 Ensure ticker and instrument-type keywords (for example ORCL, MSFT, JPM, VOO, BTC, ETH, bond, gold, silver) resolve through existing Market search behavior.

## 2. Market page UX and semantics

- [x] 2.1 Update `luminaforge/src/app/market/page.tsx` header, helper text, placeholders, and result semantics to investment-market terminology.
- [x] 2.2 Keep Attack Point 1/2/3 hint ladder behavior intact while revising examples/messages to investment context.
- [x] 2.3 Ensure schema and column discovery cards/banners use metadata wording that does not reference luxury products.

## 3. API and compatibility checks

- [x] 3.1 Verify `/api/market/search` contract remains unchanged while returning investment-oriented rows for benign queries.
- [x] 3.2 Confirm SQLi payload paths for schema and column discovery still function and remain eligible for SQL Firewall/WAF demo logging.

## 4. Validation and rollout

- [x] 4.1 Update or add tests/fixtures affected by renamed market records and categories.
- [x] 4.2 Run `npm run build` for `luminaforge` and perform a manual smoke test on `/market` for ticker, type, schema, and column flows.
- [ ] 4.3 Deploy to demo VM/LB environment and verify presenter-facing examples match the new investment narrative.
