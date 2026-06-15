## 1. Demo Control layout component

- [x] 1.1 Add `DemoControlSection` (or equivalent) with header row (title left, optional `protect` slot right) and `grid-cols-3` body with `viewLeft`, `viewMiddle`, `risk` slots
- [x] 1.2 Refactor section 1 (global) to use header protect + view/risk column slots per design
- [x] 1.3 Refactor section 3 (luminaforge) with protect in header and four view buttons split 2+2 across left/middle columns
- [x] 1.4 Refactor section 2 (Aegis SOC) to compact view/risk columns only (no protect slot)
- [x] 1.5 Apply compact spacing (`p-3`, `gap-2`) and remove LuminaForge footer note; add compact button styling if needed

## 2. Right rail and navigation

- [x] 2.1 Stack `PolicyPanel` below `MonitoredAppsPanel` in `page.tsx` right `<aside>`
- [x] 2.2 Remove `monitored-apps` from `NavSection` in `sidebar-types.ts`
- [x] 2.3 Remove Monitored Apps from `Sidebar.tsx` `PRIMARY_NAV` and delete `section === "monitored-apps"` branch in `page.tsx`
- [x] 2.4 Verify Policy center-page (`section === "policy"`) still works for full-width review

## 3. Verification

- [x] 3.1 Manually test all Demo Control buttons (global, aegis views/purge, luminaforge) still execute and refresh Monitored Apps
- [x] 3.2 Confirm right rail order: Monitored Apps → Firewall Policy → Live Violations at `lg+`
- [x] 3.3 Confirm Command NAV has no Monitored Apps entry
