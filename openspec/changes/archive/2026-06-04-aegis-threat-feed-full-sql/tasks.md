## 1. Row selection on ViolationsTable

- [x] 1.1 Add optional `selectedId` and `onRowSelect` props to `ViolationsTable.tsx`
- [x] 1.2 When `onRowSelect` is provided, make rows clickable with pointer cursor and selected-row highlight styling

## 2. Full SQL panel component

- [x] 2.1 Create `FullSqlPanel.tsx` with title "Full SQL", placeholder when no selection, and scrollable monospace `pre` for `sql_text`
- [x] 2.2 Match existing `glass-panel` / neon header styling used by `ViolationsTable`

## 3. Threat Feed composite layout

- [x] 3.1 Create `ThreatFeedPanel.tsx` (or equivalent) with 50/50 flex split: table top, Full SQL bottom
- [x] 3.2 Hold `selectedViolation` state in the panel; pass selection handlers to the table and SQL to `FullSqlPanel`
- [x] 3.3 Replace Threat Feed branch in `page.tsx` to use the new panel instead of bare `ViolationsTable`

## 4. Documentation

- [x] 4.1 Update `aegis-vault/SPEC-aegis.md` Threat Feed section to describe split layout and Full SQL selection

## 5. Manual verification

- [x] 5.1 Manual: Threat Feed shows table + Full SQL at ~50/50 height
- [x] 5.2 Manual: click row → highlight + full SQL appears; long SQL scrolls
- [x] 5.3 Manual: Dashboard / Violations / sidebar tables unchanged
