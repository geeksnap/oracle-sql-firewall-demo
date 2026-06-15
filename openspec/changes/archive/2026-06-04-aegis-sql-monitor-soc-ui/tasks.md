## 1. Database package (v2.4.0)

- [x] 1.1 Add `set_sql_block(p_username, p_block, p_msg)` — `UPDATE_ALLOW_LIST_ENFORCEMENT` when SQL Monitor disabled; `ENABLE_ALLOW_LIST` when enabled; reject `AEGIS_APP`
- [x] 1.2 Point luminaforge `block-on` / `block-off` demo actions at `set_sql_block`; bump package version to 2.4.0 and `build-info.json`

## 2. Query and policy model

- [x] 2.1 Add `buildFirewallPosture` / extend poll snapshot with posture per app (defence label, sql_monitor, block_sql, capture)
- [x] 2.2 Override `mapFirewallControlLabel` for `AEGIS_APP` → fixed **DETECT · LOG ONLY** when global FW on; rename user-visible allow-list strings to **SQL Monitor**
- [x] 2.3 Refactor `PolicyPanel` to render posture cards (aligned with Monitored Apps); update centre Policy page to use same data

## 3. Demo Control UI

- [x] 3.1 Rename section 2 to **Security Operation Center**; add fixed detect-only note; keep view/purge only
- [x] 3.2 Add LuminaForge **Firewall Setup** (3-col: capture start/stop, enable block SQL, disable block SQL)
- [x] 3.3 Reorganize remaining LuminaForge actions under **SQL Monitor & operations** with renamed labels (`view-sql-monitor`, display copy)
- [x] 3.4 Update `demo-control-types.ts`, `demo-control.ts` display SQL and scope actions for `set_sql_block`

## 4. Verification

- [x] 4.1 After DB grant v2.4.0: toggle block with SQL Monitor off and on; Policy rail and Monitored Apps stay in sync
- [x] 4.2 Confirm AEGIS_APP shows **DETECT · LOG ONLY** and no block controls in Demo Control
- [x] 4.3 `npm run build` passes
