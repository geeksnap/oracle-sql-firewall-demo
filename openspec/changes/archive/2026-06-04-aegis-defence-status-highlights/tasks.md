## 1. Demo Control nav (always dark red)

- [x] 1.1 Update `Sidebar.tsx` inactive Demo Control classes to dark red text/border (no slate-400)
- [x] 1.2 Verify active Demo Control remains stronger red than inactive

## 2. Defence status data key

- [x] 2.1 Add `FirewallDefenceStatus` + `defence_status` to `lib/types.ts`
- [x] 2.2 Return `defence_status` from `mapFirewallControlLabel()` in `lib/db/queries.ts`

## 3. Monitored Apps highlights

- [x] 3.1 Add per-`defence_status` pill + card style map in `MonitoredAppsPanel.tsx`
- [x] 3.2 Add **Defence status** sublabel; apply card accent when not in violation alert mode
- [x] 3.3 Ensure all five labels render with distinct highlights per spec table

## 4. Verification

- [x] 4.1 Manual: Demo Control inactive is dark red; each defence state visually distinct on both apps
