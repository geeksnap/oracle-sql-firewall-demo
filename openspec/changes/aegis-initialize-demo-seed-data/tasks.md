# Tasks

## 1. Database — seed init procedure

- [ ] 1.1 Audit `sql/luminaforge_reinit_transactions.sql` vs `Oracle_DB_Setup.sql` transaction seed and document (in code comments) any gap for full `user_id = 1` wipe/reload; verify relative `SYSTIMESTAMP - INTERVAL` offsets remain the date strategy
- [ ] 1.2 Add `luminaforge.aegis_demo_initialize_seed_data` (or shared `sql/` include used by grant + `reset-demo-data.sql`) that restores `users` roles/passwords/roster, `portfolio`, transactions (via extended reinit), and `luxury_items` using only credentials already present in setup/reset SQL — verify by compiling the procedure as SYS in the demo PDB without ORA errors
- [ ] 1.3 Extend `Oracle_DB_Demo_Control_Grant.sql` with `SYS.aegis_demo_control.initialize_demo_seed_data`, bump `package_version`, grant execute path unchanged for `AEGIS_APP` — verify `SELECT SYS.aegis_demo_control.package_version() FROM dual` returns the new version and a manual `BEGIN ... initialize_demo_seed_data(:msg); END;` succeeds

## 2. Aegis demo-control API

- [ ] 2.1 Add `initialize-demo-seed-data` to `DemoAction` and map it in `lib/db/demo-control.ts` (SQL stub + execute) for scope `luminaforge` — verify TypeScript build and that execute rejects unknown scopes/actions as before
- [ ] 2.2 Confirm `/api/demo-control/execute` already requires break-glass grant for the new action (no auth bypass) — verify unauthenticated POST returns rejection and does not mutate data
- [ ] 2.3 Update `expectedDbPackageVersion` (and any related build/status copy) to match the bumped package version — verify `/api/build` reports expected version consistent with grant script

## 3. Command Nav UI + Break-Glass gate

- [ ] 3.1 Add **Initialize Demo Seed Data** action button in `Sidebar.tsx` directly under **Break-Glass Control** without adding a third `NavSection` — verify visual placement and that Dashboard / Break-Glass remain the only navigable sections
- [ ] 3.2 Wire click handler: if no break-glass grant, open existing Break-Glass login modal; after grant + confirm dialog, POST `initialize-demo-seed-data`; surface SQL/result in Demo Control console when mounted (fallback status if not) — verify cancel leaves DB unchanged and success path shows procedure message
- [ ] 3.3 Keep §3.3 **Reinitialize default transaction data** unchanged and ensure confirm copy for the new button names full multi-table reload — verify both controls remain distinct in the UI

## 4. Specs and presenter docs

- [ ] 4.1 Update `aegis-vault/SPEC-aegis.md` §3 / §3.1 for the Command Nav seed action, tables covered, relative dates, and demo-control dependency — verify wording matches `aegis-demo-seed-init` scenarios
- [ ] 4.2 Add a short note to `docs/DEMO-BRIEFING-SCRIPT.md` (or equivalent) distinguishing full **Initialize Demo Seed Data** from transaction-only reinit — verify Scope reset steps reference the new button where full restore is intended

## 5. Integration check

- [ ] 5.1 End-to-end smoke on demo PDB: break-glass login → Initialize Demo Seed Data → confirm → LuminaForge roster/roles, portfolio, luxury_items, and relative-dated transactions match seed baseline; repeat Attack Point 2 / 3 prep without SQL*Plus — verify success message and table counts/roles
