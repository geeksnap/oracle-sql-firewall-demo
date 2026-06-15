## 1. Backend (documentation only)

- [x] 1.1 Update `searchLuxuryItems` comment in `vulnerable-queries.ts` with schema UNION payload contract
- [x] 1.2 Update `api/market/search/route.ts` comment with schema discovery payload (if present)

## 2. Market Explorer UI

- [x] 2.1 Add dual demo hints on `market/page.tsx` (boolean + schema UNION payloads)
- [x] 2.2 Detect `category === 'SCHEMA'` rows; render table name, `SCHEMA` badge, price as “—”
- [x] 2.3 Add schema leak warning banner when any `SCHEMA` row is present

## 3. Documentation

- [x] 3.1 Update `luminaforge/SPEC-luminaforge.md` Attack Point 1 — boolean + schema enumeration
- [x] 3.2 Update `luminaforge/README.md` demo payloads table with schema UNION row

## 4. Verification

- [x] 4.1 `npm run build` in `luminaforge` passes
- [x] 4.2 Manual: `' OR '1'='1` still returns all luxury items
- [x] 4.3 Manual: schema UNION returns `USERS`, `TRANSACTIONS`, `LUXURY_ITEMS`, `PORTFOLIO` with `SCHEMA` badge and leak banner
