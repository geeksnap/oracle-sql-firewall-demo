## Context

The Threat Feed section in `page.tsx` renders a single `ViolationsTable` with `showSourceApp` and full variant. SQL appears in a truncated table cell (`max-w-[240px] truncate`). The center column uses `flex flex-col gap-4` without a fixed viewport height, so the table grows with content.

`FirewallViolation.sql_text` already carries the full statement from the poller/WebSocket pipeline — no API changes required.

## Goals / Non-Goals

**Goals:**
- 50/50 vertical split within the Threat Feed section: top = table, bottom = **Full SQL**.
- Click-to-select row; highlighted row styling; full SQL in monospace, scrollable pre/formatted text.
- Preserve existing columns (Time, Source App, User, Type, Action, truncated SQL preview in table).

**Non-Goals:**
- No change to Violations tab, Dashboard, or sidebar compact table.
- No copy-to-clipboard, syntax highlighting, or multi-select (unless trivial later).
- No backend or poller changes.

## Decisions

### Layout: `ThreatFeedPanel` wrapper
**Decision:** Add `ThreatFeedPanel` that wraps `ViolationsTable` + `FullSqlPanel` in a flex column with `min-h-0` and `flex-[1]` / `flex-[1]` children (equal flex grow = 50/50 of available height).

**Rationale:** Keeps `page.tsx` thin and isolates Threat Feed–only behavior. Parent section may need `flex-1 min-h-0` on the threat-feed branch so the split fills the main column height on large screens.

**Alternative:** Extend `ViolationsTable` with `onSelectRow` + built-in detail pane — rejected to avoid bloating a shared component used in four places.

### Row selection on `ViolationsTable`
**Decision:** Add optional props: `selectedId?: string`, `onRowSelect?: (violation: FirewallViolation) => void`. When `onRowSelect` is set, rows are `cursor-pointer`, click sets selection, selected row gets distinct background (e.g. `bg-[#00f9ff]/15`).

**Rationale:** Minimal API surface; other consumers ignore the props.

### Full SQL panel content
**Decision:** `FullSqlPanel` shows title **Full SQL**, `glass-panel` styling consistent with the table. Body: `<pre className="whitespace-pre-wrap break-all font-mono text-xs">` with `overflow-auto` and `flex-1`. Placeholder: "Select a violation row to view full SQL." For `sql_text` of `N/A` (break-glass synthetic rows), display as-is.

## Risks / Trade-offs

- [Risk] Center column may not have explicit height on small viewports → split collapses to content-sized panels. **Mitigation:** Use `min-h-[480px]` or `h-[calc(100vh-12rem)]` on `ThreatFeedPanel` for lg breakpoints only.
- [Risk] Truncated SQL column redundant with Full SQL panel. **Mitigation:** Keep truncated preview for scanability; optional follow-up to hide SQL column on Threat Feed only.

## Migration Plan

1. Implement components and wire Threat Feed in `page.tsx`.
2. Update `SPEC-aegis.md`.
3. Manual verify: select row, switch rows, empty state, long SQL scroll.

## Open Questions

None.
