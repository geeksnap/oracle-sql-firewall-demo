## Why

Market Explorer already shows a clear OCI WAF block alert when SQL injection is stopped at the edge, but Attack Points 2–4 still only surface inline errors that are easy to miss during live demos. Presenters need the same unmistakable WAF feedback on every attack input, and the Market search field must remain a simple fixed single-line text box with no dropdown or suggestion UI.

## What Changes

- Extend the Market Explorer WAF block pattern to Transaction History, Custom Statement, and Bulk Action attack inputs.
- On HTTP **403** from OCI WAF on any attack-point API route, show `window.alert("SQL injection detected by OCI WAF and blocked.")` and keep the existing inline error message.
- Introduce a shared client helper so all four attack points use the same WAF alert behavior and message text.
- Reaffirm Market Explorer uses a fixed single-line `<input type="text">` with `autoComplete="off"` — no `<textarea>`, `<datalist>`, select, or suggestion dropdown on the Market search card.
- Standardize Bulk Action's attack input (`Batch Execution Note`) to the same plain fixed single-line text input pattern as Market (replacing multi-line textarea).
- Ensure Transaction History and Custom Statement attack inputs also disable browser autocomplete and avoid dropdown/suggestion UI on the attack field itself.

## Capabilities

### New Capabilities
- `luminaforge-attack-point-waf-block-alert`: Defines consistent OCI WAF **403** browser-alert behavior for Attack Points 2, 3, and 4 (and shared helper used by all attack screens).

### Modified Capabilities
- `luminaforge-market-search-input`: Reaffirms Market search is a fixed plain text input with no dropdown/suggestion controls (regression guard after prior change).
- `luminaforge-attack-surface`: Extends WAF block alert requirements from Attack Point 1 only to Attack Points 2–4.

## Impact

- Affected code: `luminaforge/src/lib/` (new shared WAF alert helper), `luminaforge/src/app/market/page.tsx`, `luminaforge/src/components/TransactionHistoryLookup.tsx`, `luminaforge/src/app/statement/page.tsx`, `luminaforge/src/components/BulkActionPanel.tsx`.
- No API, database, or WAF rule changes.
- Navbar `UniversalSearchBar` dropdown remains out of scope.
