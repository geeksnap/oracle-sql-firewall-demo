## 1. Status Update terminology

- [x] 1.1 Rename header label from “Poll sync” to “Status Update” in `Header.tsx`
- [x] 1.2 Update Demo Control footer/help copy and `SPEC-aegis.md` to use Status Update (not Poll)
- [x] 1.3 Rename user-facing socket/log comments in `server.ts` / poller if any visible strings remain

## 2. Command NAV — Demo Control

- [x] 2.1 Refactor `Sidebar.tsx`: primary nav items + Demo Control pinned to bottom (`mt-auto`)
- [x] 2.2 Apply dark red active/hover styles for Demo Control (`#7f1d1d` / `#991b1b` palette)

## 3. Global firewall status (header)

- [x] 3.1 Add `fetchGlobalFirewallStatus()` querying `dba_sql_firewall_status` in `lib/db/queries.ts`
- [x] 3.2 Include `firewall_enabled` from DB in poll snapshot / metrics (remove hardcoded `true`)
- [x] 3.3 Extend demo-control execute API response with `firewallGloballyEnabled` on global on/off success
- [x] 3.4 Wire `page.tsx` + `Header.tsx` to update Firewall pill on status update and after Demo Control toggle

## 4. Aegis Shield hero

- [x] 4.1 Enlarge shield container on dashboard (`page.tsx` layout / `ShieldGlobe` height)
- [x] 4.2 Refine shield visuals (geometry, materials, optional crest overlay) for elegant Aegis branding
- [x] 4.3 Preserve alert-mode coloring when LuminaForge is attacked

## 5. Demo Control tri-column layout

- [x] 5.1 Add `variant="info"` (blue) to `DemoControlButton.tsx`
- [x] 5.2 Refactor `DemoControlPanel.tsx` / `AppSection` to `grid-cols-3` with left=green, center=blue, right=red per design table
- [x] 5.3 Assign each action to correct column for global, Aegis, and LuminaForge sections

## 6. Monitored Apps firewall control status

- [x] 6.1 Extend `MonitoredAppStatus` / `lib/types.ts` with `firewall_control_label` and `firewall_control_tone`
- [x] 6.2 Query `dba_sql_firewall_allow_lists` in `fetchPollSnapshot` (or definer `view_allow_list` fallback); fix capture vs allow-list query split
- [x] 6.3 Map allow-list `status` / `block` / global firewall into presenter labels in `buildMonitoredApps`
- [x] 6.4 Update `MonitoredAppsPanel.tsx` to show firewall control pill instead of `online`; keep alert card styling when violations > 0

## 7. Verification

- [x] 7.1 Manual test: Status Update label visible; Demo Control at bottom in dark red
- [x] 7.2 Manual test: Firewall pill toggles ACTIVE/OFFLINE with global on/off buttons
- [x] 7.3 Manual test: tri-column layout on desktop and stacked layout on narrow viewport
- [x] 7.4 Manual test: Monitored Apps show ENFORCED · BLOCK / ALLOW-LIST OFF / FIREWALL OFF per demo state (not ONLINE)
