## 1. Dashboard column layout

- [x] 1.1 Add `items-stretch` to main content grid; enable `flex-1 min-h-0` on center section when Dashboard is active
- [x] 1.2 Split Dashboard into top (`MetricsCards` + `ShieldGlobe`, shrink-0) and bottom (`LatestThreatsPanel`, `flex-1 min-h-[50%] min-h-0`)

## 2. Latest Threats panel height

- [x] 2.1 Add `fillHeight` (or equivalent) to `ViolationsWithFullSql` / `LatestThreatsPanel` for `h-full min-h-0 flex-1`
- [x] 2.2 Increase Dashboard violation slice from 8 to 12 in `page.tsx`

## 3. Documentation

- [x] 3.1 Update `SPEC-aegis.md` Dashboard / Latest Threats sizing relative to Command Nav

## 4. Manual verification

- [x] 4.1 Manual: on `lg`, Latest Threats + Full SQL is ~half center column and bottom aligns with Command Nav
- [x] 4.2 Manual: table scrolls with 12+ rows; row click still fills Full SQL
- [x] 4.3 Manual: Threat Feed layout unchanged
