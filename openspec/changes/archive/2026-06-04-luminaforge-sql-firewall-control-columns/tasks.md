## 1. Database package (v2.6.0)

- [x] 1.1 `set_sql_monitor`: on enable, read current `BLOCK` and pass to `ENABLE_ALLOW_LIST`; on disable, `DISABLE_ALLOW_LIST` only
- [x] 1.2 `set_sql_block`: when `STATUS=ENABLED`, use `UPDATE_ALLOW_LIST_ENFORCEMENT` only; preserve monitor when toggling block
- [x] 1.3 Bump package to 2.6.0 and `build-info.json`

## 2. Demo Control UI

- [x] 2.1 Rename section to **3. Luminaforge — SQL Firewall Control Center**
- [x] 2.2 Refactor layout to `grid md:grid-cols-3` with column labels 3.1 / 3.2 / 3.3 and existing buttons in each column

## 3. Verification

- [x] 3.1 `npm run build` passes
- [ ] 3.2 Manual: four combinations monitor on/off × block on/off via 3.1 buttons; Policy rail matches dictionary
