## 1. Database (v2.5.0)

- [x] 1.1 Add `set_sql_monitor(p_username, p_enable, p_msg)` — enable: `ENABLE_ALLOW_LIST` block FALSE; disable: `DISABLE_ALLOW_LIST`; reject `AEGIS_APP`
- [x] 1.2 Add `sql-monitor-enable` to luminaforge scope in `demo-control.ts`; bump package to 2.5.0 and `build-info.json`

## 2. SOC posture display

- [x] 2.1 In `buildMonitoredApps`, force AEGIS_APP `sql_monitor_enabled=true`, `block_sql=false` when global FW on
- [x] 2.2 Ensure `mapFirewallControlLabel` for AEGIS_APP remains **DETECT · LOG ONLY**

## 3. Demo Control UI

- [x] 3.1 Trim SOC section: keep View violations + Clear logs; remove view-sql-monitor and view-capture-status from aegis scope
- [x] 3.2 Add `LuminaforgeFirewallControlCenter` with 3.1 / 3.2 / 3.3 sub-sections per design
- [x] 3.3 Remove old LuminaForge `FirewallSetupSection` + second section; delete unused component if applicable
- [x] 3.4 Wire 3.1: sql-monitor-enable/disable, block-on/off; 3.2: views; 3.3: capture + purge

## 4. Verification

- [x] 4.1 `npm run build` passes
- [x] 4.2 Manual: Aegis shows Monitor ON / Block OFF; LuminaForge 3.1 toggles update Policy rail; SOC has two buttons only
