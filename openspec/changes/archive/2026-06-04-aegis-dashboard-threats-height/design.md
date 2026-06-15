## Context

The main content grid uses `min-h-[calc(100vh-8rem)]`. The left **Command Nav** sidebar (`Sidebar.tsx`) uses `h-full flex-col` and stretches with the grid row. The Dashboard center `<section>` stacks `MetricsCards`, `ShieldGlobe`, and `LatestThreatsPanel` with `gap-4` but no height budget — `LatestThreatsPanel` only has `min-h-[280px]`, so it does not grow with viewport.

`LatestThreatsPanel` uses `ViolationsWithFullSql` with `detailShare="third"`. `page.tsx` passes `violations.slice(0, 8)`.

## Goals / Non-Goals

**Goals:**
- Latest Threats + Full SQL block occupies **at least half** of the Dashboard center column height below the header row, filling space to the bottom of the Command Nav column on `lg` layouts.
- Table body scrolls inside the panel; more rows visible (increase feed limit and rely on scroll).
- Metrics + globe remain above; no layout change to Threat Feed, Break-Glass, or right aside.

**Non-Goals:**
- No change to Threat Feed 50/50 layout.
- No new API or data model changes.
- Mobile stacking can use a reasonable `min-h` fallback without perfect 50% math.

## Decisions

### Dashboard column flex shell
**Decision:** When `section === "dashboard"`, wrap content in `flex flex-1 min-h-0 flex-col`:
- Top: `shrink-0` wrapper for `MetricsCards` + `ShieldGlobe`
- Bottom: `flex-1 min-h-[50%] min-h-0` wrapper for `LatestThreatsPanel`

**Rationale:** `flex-1` on the threats block consumes all space below metrics/globe; `min-h-[50%]` enforces the “half the column” requirement even when the globe is short.

### Grid row stretch
**Decision:** Add `items-stretch` to the main `lg:grid` and `min-h-0 flex-1 flex-col` on the center `<section>` when on Dashboard (same pattern as Threat Feed).

**Rationale:** Aligns center column height with Command Nav `h-full`.

### More rows in feed
**Decision:** Increase slice to **12** rows in `page.tsx` (tunable constant). Table scroll handles overflow.

**Alternative:** Show all violations with slice removed — rejected to keep Dashboard focused on “latest”.

### `ViolationsWithFullSql` dashboard mode
**Decision:** Add optional prop `fillHeight?: boolean` (or `layout="dashboard"`) that applies `h-full min-h-0 flex-1` instead of `min-h-[280px]` only.

**Rationale:** Threat Feed keeps its own min-height; Dashboard panel fills parent.

## Risks / Trade-offs

- [Risk] Short viewports: metrics + globe + 50% threats may overflow. **Mitigation:** `min-h-0` + internal scroll on table and Full SQL only.
- [Risk] Globe is tall on small screens. **Mitigation:** acceptable; threats panel still gets `flex-1` with scroll.

## Migration Plan

1. Update `page.tsx` dashboard layout and slice count.
2. Update `LatestThreatsPanel` / `ViolationsWithFullSql` height props.
3. Update `SPEC-aegis.md`.
4. Manual verify on `lg` breakpoint: threats block height ≈ half column, bottom lines up with Command Nav.

## Open Questions

None.
