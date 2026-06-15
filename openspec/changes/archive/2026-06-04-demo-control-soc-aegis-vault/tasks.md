## 1. Database package (v2.7.0)

- [x] 1.1 Add `clear_firewall_policy(p_username, p_msg)` — disable/drop allow-list; stop/drop capture for luminaforge only
- [x] 1.2 Bump `c_package_version` to 2.7.0 and `aegis-vault/build-info.json`

## 2. Demo Control API and UI

- [x] 2.1 Add `clear-firewall-policy` to `demo-control-types.ts`, luminaforge scope in `demo-control.ts` (PL/SQL bind + confirm in `isMutatingAction`)
- [x] 2.2 Rename §2 title to **2. Aegis Vault - Security Operation Center** in `DemoControlPanel.tsx`
- [x] 2.3 Add **Clear captured SQL rules** button in `LuminaforgeFirewallControlCenter.tsx` §3.3 with confirm dialog

## 3. Monitored Apps and Policy

- [x] 3.1 Filter `buildMonitoredApps` (or display helper) to emit **luminaforge** only
- [x] 3.2 Verify `PolicyPanel` and `MonitoredAppsPanel` show single LuminaForge card; update `Sidebar.tsx` monitoring copy if needed

## 4. Verification

- [x] 4.1 `npm run build` passes
- [ ] 4.2 Manual: clear policy → start capture → confirm Monitored Apps/Policy show luminaforge only; §2 title correct
