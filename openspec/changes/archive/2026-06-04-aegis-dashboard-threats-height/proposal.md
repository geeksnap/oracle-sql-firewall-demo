## Why

On the Dashboard, **Latest Threats** and **Full SQL** are cramped (`min-h-[280px]`, only 8 rows). Presenters need a taller violations block that shows more rows and extends down to align with the bottom of the **Command Nav** sidebar, using the vertical space below the metrics and globe.

## What Changes

- Restructure the Dashboard center column as a flex layout: top = metrics + shield globe (intrinsic height); bottom = **Latest Threats + Full SQL** consuming **~50% of the column height** and all remaining space down to the Command Nav row baseline.
- Stretch the center column and sidebar to the same grid row height (`items-stretch`, `min-h-0`, `flex-1`) so Latest Threats bottom-aligns with Command Nav.
- Enlarge **Latest Threats** table scroll area so more rows are visible; increase the violation slice passed from `page.tsx` (e.g. 8 → 12 or 15).
- Keep internal split: table ~2/3, Full SQL ~1/3 within the enlarged block.
- Row selection and Full SQL behavior unchanged.

## Capabilities

### New Capabilities
- `aegis-dashboard-threats-height`: Dashboard layout sizing for Latest Threats + Full SQL relative to Command Nav.

### Modified Capabilities

## Impact

- `aegis-vault/src/app/page.tsx` — Dashboard flex/grid structure, violation slice count
- `aegis-vault/src/components/LatestThreatsPanel.tsx` / `ViolationsWithFullSql.tsx` — height/flex classes for dashboard mode
- `aegis-vault/SPEC-aegis.md` — Dashboard layout note
