## Why

The Threat Feed table truncates SQL in a narrow column, which makes it hard to read injection payloads during live demos. Presenters need the complete statement without leaving the Threat Feed view.

## What Changes

- Split the Threat Feed main content into two stacked panels with a **50/50 height** split (table on top, detail on bottom).
- Add a **Full SQL** detail panel below the violations table.
- When a row is selected (highlighted), show that violation's full `sql_text` in the Full SQL panel.
- Row selection via click; visual highlight on the active row.
- Empty state in Full SQL when no row is selected (placeholder text).
- Scope limited to the **Threat Feed** nav section only — Dashboard, All Violations, and Live Violations sidebar are unchanged.

## Capabilities

### New Capabilities
- `aegis-threat-feed-full-sql`: Threat Feed layout with selectable rows and a Full SQL detail pane occupying half the section height.

### Modified Capabilities

## Impact

- `aegis-vault/src/app/page.tsx` — replace single `ViolationsTable` with a Threat Feed composite layout.
- New component(s): e.g. `ThreatFeedPanel.tsx` and/or `FullSqlPanel.tsx`; optional row-selection props on `ViolationsTable.tsx`.
- `aegis-vault/SPEC-aegis.md` — document Threat Feed Full SQL behavior.
