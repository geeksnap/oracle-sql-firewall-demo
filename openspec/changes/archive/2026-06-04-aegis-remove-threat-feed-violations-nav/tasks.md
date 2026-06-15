## 1. Nav types and sidebar

- [x] 1.1 Remove `threat-feed` and `violations` from `NavSection` in `sidebar-types.ts`
- [x] 1.2 Update `Sidebar.tsx` `PRIMARY_NAV` to only **Dashboard** (remove Threat Feed and Violations entries)
- [x] 1.3 Adjust `Exclude<NavSection, ...>` typing if needed after union shrink

## 2. Main shell routing

- [x] 2.1 Remove `threat-feed` and `violations` branches from `page.tsx` (imports, section conditionals, layout classes tied to those sections)
- [x] 2.2 Ensure `handleNavSelect` and default `section` state only use `dashboard` | `break-glass-control`
- [x] 2.3 Delete `ThreatFeedPanel.tsx` if unreferenced; remove unused imports

## 3. Canonical spec

- [x] 3.1 Update `aegis-vault/SPEC-aegis.md` §3 Layout: Command Nav = Dashboard | Break-Glass Control only; remove Threat Feed / Violations center routes; note violation surfacing via Dashboard + right rail

## 4. Verification

- [x] 4.1 `npm run build` in `aegis-vault` passes
- [x] 4.2 Manual: Command Nav shows only Dashboard + Break-Glass Control
- [x] 4.3 Manual: Dashboard Latest Threats + Full SQL and right-rail Live Violations still work; globe/metrics unchanged
- [x] 4.4 Manual: Break-Glass Control section still opens and functions
