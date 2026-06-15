## Why

Attack Point 1 (Market Explorer) today only demonstrates a boolean `OR 1=1` bypass that dumps all `luxury_items`. Presenters need a second, visually obvious reconnaissance step—**schema enumeration**—that leaks Oracle table names into the same results grid so audiences see how injection pivots from data theft to mapping the database surface (users, transactions, etc.) before deeper attacks on Points 2–3.

## What Changes

- Extend Market Explorer UI to support a **schema discovery** demo mode alongside the existing boolean-bypass payload.
- Add a documented **UNION** injection payload against `user_tables` (or equivalent data dictionary view) that returns table names in the search results grid.
- Render schema-discovery rows distinctly (e.g. table name as primary label, category badge `SCHEMA`, suppressed or zero price) so presenters can contrast luxury assets vs. leaked metadata.
- Update demo hint copy on `/market` to show both payloads: boolean bypass and schema table list.
- Update `luminaforge/SPEC-luminaforge.md` and README demo payload table for Attack Point 1.

## Capabilities

### New Capabilities

- `luminaforge-market-schema-discovery`: UNION-based schema enumeration via Market Explorer search, UI presentation of leaked table names, and presenter demo scenarios.

### Modified Capabilities

- `luminaforge-attack-surface`: Extend Attack Point 1 requirements with schema-discovery UNION scenario (in addition to boolean bypass).

## Impact

- `luminaforge/src/app/market/page.tsx` — dual demo hints, schema-row rendering, optional leak banner
- `luminaforge/src/lib/db/vulnerable-queries.ts` — comment/payload contract only (concat SQL unchanged)
- `luminaforge/README.md` — Attack Point 1 payloads
- `luminaforge/SPEC-luminaforge.md` — Attack Point 1 description
- OpenSpec main spec `openspec/specs/luminaforge-attack-surface/spec.md` (via delta sync on archive)

No new API routes; `POST /api/market/search` remains the single vulnerable endpoint.
