## Why

Presenters using the Market Explorer screen need a plain free-text search field for SQL injection demos (no dropdown or suggestion UI), and an immediate, unmistakable signal when OCI WAF blocks a payload. Today the search control can feel like a dropdown-style control, and WAF blocks only appear as inline error text that is easy to miss during live demos.

## What Changes

- Replace the Market Explorer search control with a plain single-line text input (no `<datalist>`, no autocomplete dropdown, no select/picker UI).
- Disable browser autocomplete on the Market search field so prior payloads do not appear as a pull-down suggestion list.
- When `POST /api/market/search` returns HTTP **403** from OCI WAF, pop a browser alert informing the user that SQL injection was detected by OCI WAF and blocked.
- Keep existing inline error display for non-WAF failures; WAF **403** SHALL trigger both the alert and the inline message.
- Scope is limited to the Market Explorer page search card (`/market`); navbar Universal Search Bar behavior is unchanged unless required for consistency.

## Capabilities

### New Capabilities
- `luminaforge-market-search-input`: Defines Market Explorer search input UX — plain text field only, no dropdown/suggestion controls.
- `luminaforge-market-waf-block-alert`: Defines presenter-facing alert behavior when OCI WAF blocks a Market search request.

### Modified Capabilities
- `luminaforge-attack-surface`: Market Explorer Attack Point 1 SHALL surface OCI WAF block feedback via an explicit alert in addition to existing search error handling.

## Impact

- Affected code: `luminaforge/src/app/market/page.tsx` (primary), possibly shared input styling tokens.
- Affected specs: new Market search-input and WAF-alert capabilities; delta on `luminaforge-attack-surface`.
- No API or database schema changes; WAF/LB configuration unchanged.
