## Context

`page.tsx` is the single shell that renders all Aegis Vault sections inside a `<section className="flex flex-col gap-4">` container. Currently:

- The Break-Glass Control section renders `<DemoControlPanel>` as the first child with no extra vertical offset — its heading sits flush against the top of the content column.
- The Dashboard section renders `<MetricsCards>`, `<ShieldGlobe>`, and a violations table directly, with no section-level header to frame the view.

All other sections (Threat Feed, All Violations) rely on a title prop inside `<ViolationsTable>`. The dashboard is the only section with multiple mixed components and no heading.

## Goals / Non-Goals

**Goals:**
- Add visible top breathing-room to the Break-Glass Control content.
- Add a section header above the Dashboard metrics to establish context.

**Non-Goals:**
- No redesign of any component.
- No changes to metrics data, APIs, or socket logic.

## Decisions

### Break-Glass top spacing
**Decision:** Wrap `<DemoControlPanel>` in a `<div className="pt-4">` inside `page.tsx`.  
**Rationale:** The `<section>` already uses `gap-4` between siblings. Adding a wrapper `pt-4` targets only the break-glass slot without touching the component or affecting other sections. Alternatively a `mt-4` on the panel itself would require component-level change — avoidable.

### Dashboard summary header
**Decision:** Add a header `<div>` immediately above `<MetricsCards>` inside the dashboard conditional block in `page.tsx`. Header contains:
- Title: `"Security Operations Center"`  
- Subtitle: current UTC timestamp (using `<LastPoll>` pattern, i.e., plain text showing last-poll time from `metrics.lastPollAt`) or static descriptive text.  

Keep it lightweight — a single `glass-panel rounded-xl px-4 py-3` block matching the style of the Break-Glass Control header in `DemoControlPanel.tsx`.

## Risks / Trade-offs

- [Risk] Extra `pt-4` wrapper adds a wrapping DOM element → negligible, no style conflicts.

## Migration Plan

1. Edit `aegis-vault/src/app/page.tsx` — two targeted JSX changes.
2. No migration needed; purely additive visual changes.

## Open Questions

None.
