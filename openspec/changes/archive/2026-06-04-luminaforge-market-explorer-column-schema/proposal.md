## Why

Market Explorer Attack Point 1 now supports a two-step recon ladder: boolean bypass, then `user_tables` enumeration. Presenters need a **third step** that pivots on a discovered table name (e.g. `USERS`) and leaks **column names and data types** from `user_tab_columns`—mirroring real-world SQLi progression before credential or row exfiltration on Points 2–3.

## What Changes

- Add a canonical **step 3** UNION payload targeting `user_tab_columns` filtered by `table_name` (presenter substitutes the table from step 2).
- Extend Market Explorer UI: third demo hint, optional **click-to-pivot** from a `SCHEMA` result row into the step-3 payload, distinct rendering for `COLUMNS` rows, and a column-schema leak banner.
- Document the three-step Attack Point 1 flow in `SPEC-luminaforge.md`, `README.md`, and vulnerable-route comments.
- Update OpenSpec deltas for `luminaforge-market-schema-discovery`, `luminaforge-attack-surface`, and a new `luminaforge-market-column-discovery` capability.

## Capabilities

### New Capabilities

- `luminaforge-market-column-discovery`: Step-3 column enumeration via `user_tab_columns`, UI presentation, presenter scenarios.

### Modified Capabilities

- `luminaforge-market-schema-discovery`: Extend requirements for three-step demo flow and click-to-pivot from table rows.
- `luminaforge-attack-surface`: Extend Attack Point 1 with column-schema UNION scenario.

## Impact

- `luminaforge/src/app/market/page.tsx` — step 3 hint, `COLUMNS` row styling, SCHEMA row click handler, banners
- `luminaforge/src/lib/db/vulnerable-queries.ts` — payload documentation only
- `luminaforge/src/app/api/market/search/route.ts` — comment update
- `luminaforge/SPEC-luminaforge.md`, `luminaforge/README.md`
- No new API routes or DDL
