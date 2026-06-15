## 1. Backend (documentation only)

- [x] 1.1 Add step-3 `user_tab_columns` payload to `searchLuxuryItems` comment in `vulnerable-queries.ts`
- [x] 1.2 Update `api/market/search/route.ts` comment with three-step ladder

## 2. Market Explorer UI

- [x] 2.1 Add step-3 demo hint (column payload; example table `USERS`)
- [x] 2.2 Detect `category === 'COLUMNS'` rows; render column · type label, `COLUMNS` badge, price as “—”
- [x] 2.3 Add column-schema leak banner; filter grid to `COLUMNS` rows when present
- [x] 2.4 Click `SCHEMA` row to pre-fill step-3 payload for that `table_name`

## 3. Documentation

- [x] 3.1 Update `luminaforge/SPEC-luminaforge.md` — Attack Point 1 three-step ladder
- [x] 3.2 Update `luminaforge/README.md` — step 3 payload in demo table

## 4. Verification

- [x] 4.1 `npm run build` in `luminaforge` passes
- [x] 4.2 Manual: step 2 still lists tables; step 3 on `USERS` shows `USERNAME`, `PASSWORD`, etc. with `COLUMNS` badge
- [x] 4.3 Manual: click `USERS` SCHEMA row pre-fills step-3 payload; Search returns column rows
