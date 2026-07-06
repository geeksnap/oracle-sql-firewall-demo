## 1. Database — transaction reinit procedure

- [x] 1.1 Extract transaction-only re-seed SQL from `luminaforge/scripts/reset-demo-data.sql` into `sql/luminaforge_reinit_transactions.sql` (DELETE BULK rows, reinsert cross-client rows, backfill `user_id = 1` assets)
- [x] 1.2 Add `reinit_default_transaction_data(p_msg OUT VARCHAR2)` to `SYS.aegis_demo_control` package spec/body in `Oracle_DB_Demo_Control_Grant.sql`
- [x] 1.3 Bump `c_package_version` and `aegis-vault/build-info.json` (patch version)

## 2. Backend — demo control action

- [x] 2.1 Add `reinit-default-transaction-data` to `DemoAction` and luminaforge `SCOPE_ACTIONS` in `demo-control-types.ts` / `demo-control.ts`
- [x] 2.2 Wire `sqlForAction` / `displaySql` / execute path to call `reinit_default_transaction_data`
- [x] 2.3 Verify `POST /api/demo-control/execute` returns success message in console output

## 3. UI — Break-Glass button

- [x] 3.1 Add **Reinitialize default transaction data** button to `LuminaforgeFirewallControlCenter` §3.3 Firewall setup
- [x] 3.2 Use appropriate button variant (e.g. `info` or `default`) consistent with adjacent setup actions

## 4. UI — fixed viewport shell

- [x] 4.1 Update `page.tsx` root layout: fixed viewport height (`h-screen` / `100dvh`), `overflow-hidden`, `min-h-0` on grid children
- [x] 4.2 Apply same flex discipline to Break-Glass section wrapper as Dashboard (`min-h-0 flex-1 flex-col`)
- [x] 4.3 Cap right-rail aside height; distribute flex among Monitored Apps, Policy, Live Violations

## 5. UI — violation panel scroll

- [x] 5.1 Ensure `ViolationsWithFullSql` table region has fixed flex height with `overflow-y-auto` and does not grow parent
- [x] 5.2 Ensure compact `ViolationsTable` (Live Violations) has fixed height within right rail with internal scroll
- [x] 5.3 Confirm demo-control output console scrolls internally without expanding center column width

## 6. Verification

- [x] 6.1 Dashboard: trigger 20+ violations — page body height unchanged; Latest Threats and Live Violations scroll internally
- [x] 6.2 Toggle Dashboard ↔ Break-Glass — no width shift at `lg`
- [x] 6.3 Run Attack Point 2 exfiltration, click **Reinitialize default transaction data**, confirm `/transactions` baseline restored
- [x] 6.4 Confirm user roles unchanged after transaction-only reset (post Point 4 scenario)
