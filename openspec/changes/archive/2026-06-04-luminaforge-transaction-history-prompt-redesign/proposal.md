## Why

Attack Point 2 (Transaction History) is buried in a collapsible **Advanced Search** drawer labeled “Memo / Reference ID Filter,” which is easy to miss during live demos. Presenters need a **primary, always-visible** lookup prompt that reads like a firm-wide transaction search while still using intentional SQL concatenation so a single payload can **exfiltrate every user’s transactions** (user_id 3, 4, 5, 8, 9 seeded in `Oracle_DB_Setup.sql`).

## What Changes

- Replace `AdvancedSearchDrawer` with a redesigned **Transaction History Lookup** prompt (hero search bar on `/transactions`, luxury-fintech styling aligned with Market search).
- Update copy/placeholders to describe platform-wide reference lookup (wire ID, transfer type, counterparty code) without changing the demo’s vulnerable backend contract (`POST /api/transactions/filter`, raw concat, no binds).
- Keep canonical injection outcome: benign filter → `user_id = 1` rows only; demo payload → all users’ `transactions` rows visible in the table (including high-value WIRE rows).
- Surface a presenter **demo payload hint** (e.g. `x' OR user_id<>1 --`) in the UI.
- Optionally extend results table with clearer multi-user labeling (e.g. emphasize **User ID** column when multiple users appear).
- Update `luminaforge/SPEC-luminaforge.md` Attack Point 2 description.
- **BREAKING**: Remove collapsible “Advanced Search” drawer UX; lookup is always expanded.

## Capabilities

### New Capabilities

- `luminaforge-transaction-history-prompt`: Primary Transaction History search prompt layout, copy, demo hint, and results presentation for Attack Point 2.

### Modified Capabilities

- `luminaforge-attack-surface`: Attack Point 2 requirement text — UI entry point and scenario wording move from “advanced-search drawer / memo filter” to the redesigned lookup prompt; injection outcome unchanged.

## Impact

- `luminaforge/src/app/transactions/page.tsx`
- `luminaforge/src/components/AdvancedSearchDrawer.tsx` (replace or rename)
- `luminaforge/src/app/api/transactions/filter/route.ts` (comments only unless query string copy changes)
- `luminaforge/src/lib/db/vulnerable-queries.ts` (`filterTransactions` — keep injectable; may adjust predicate wording for LIKE-style search if design chooses)
- `luminaforge/SPEC-luminaforge.md`
- Aegis Vault poller unchanged (same violation logging path)
