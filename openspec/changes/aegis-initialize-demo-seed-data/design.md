# Design

## Context

See proposal.md for motivation. Today Break-Glass exposes **Reinitialize default transaction data** (`SYS.aegis_demo_control.reinit_default_transaction_data` → `luminaforge.aegis_demo_reinit_transactions`), which restores transaction rows with relative `SYSTIMESTAMP` offsets but does **not** reset user roles/passwords, full `portfolio`, or `luxury_items`. Full restore already exists as SQL scripts (`luminaforge/scripts/reset-demo-data.sql`, seed section of `Oracle_DB_Setup.sql`) but not as a one-click Aegis control.

Constraints:
- `oracledb` Thin Mode; `try/catch/finally` with `connection.close()` in `finally`.
- Whitelisted demo actions only via `POST /api/demo-control/execute` + `SYS.aegis_demo_control` (`AUTHID DEFINER`).
- Break-glass grant already gates demo-control execute.
- Do not invent secrets; reuse passwords/roles already encoded in setup/reset SQL.
- `aegis-command-nav` allows only two navigable sections — seed control must be an action, not a third section.

## Goals / Non-Goals

**Goals:**
- Sidebar action under **Break-Glass Control** that performs full demo seed wipe + reload with relative dates.
- Single new demo-control action + PL/SQL entry point shared with existing grant script patterns.
- Prefer composing/extending `reset-demo-data.sql` / `sql/luminaforge_reinit_transactions.sql` rather than duplicating divergent seed logic.

**Non-Goals:**
- Changing LuminaForge UI or attack payloads.
- Replacing or removing §3.3 **Reinitialize default transaction data**.
- Resetting SQL Firewall policies, captures, or violation logs (those stay on existing Demo Control buttons).
- Re-running schema DDL / user creation from `Oracle_DB_Setup.sql`.
- Production RBAC or new credential stores.

## Decisions

### 1. UI placement: non-nav action under Break-Glass Control

**Decision:** Add **Initialize Demo Seed Data** in `Sidebar` `mt-auto` footer immediately below the Break-Glass Control button. Style as a distinct destructive/presenter action (not selected-section chrome). Wire click from `page.tsx` (or Sidebar callback) to: ensure break-glass grant → `window.confirm` → `POST /api/demo-control/execute` with the new action. On success, append result to the Demo Control output console when the Break-Glass panel is open; if Dashboard is active, still surface success/error via confirm-follow-up toast/alert or by briefly appending when panel mounts (prefer: always call API and `alert`/inline status if console not mounted — implementers choose the lightest existing pattern).

**Alternative considered:** Only add the button inside §3.3 — rejected because the request places it under the Break-Glass Control **button**. Duplicate button in §3.3 is optional and out of scope unless apply discovers UX confusion.

### 2. Extend demo-control enum + package (no new API)

**Decision:**
- Add `DemoAction` value `initialize-demo-seed-data`.
- Map to `BEGIN SYS.aegis_demo_control.initialize_demo_seed_data(:msg); END;`.
- Scope: prefer `luminaforge` (data lives in LuminaForge schema); allow `global` only if existing execute validation makes `luminaforge` awkward — default **`luminaforge`**.
- Reuse break-glass session check already on `/api/demo-control/execute`.
- Bump `package_version` in `Oracle_DB_Demo_Control_Grant.sql` and `expectedDbPackageVersion` in Aegis accordingly.

**Alternative considered:** New `/api/demo-seed/init` route — rejected; duplicates privilege and auth patterns.

### 3. PL/SQL body: package shared reset procedure

**Decision:** Add `luminaforge.aegis_demo_initialize_seed_data` (definer) that:
1. Restores `users` roles + passwords and inserts missing roster rows (same statements as `reset-demo-data.sql` sections 1 / 1b / 1c / password updates).
2. Deletes and reloads `portfolio` baseline for demo + cross-client users (setup + reset-demo-data coverage).
3. Calls existing `luminaforge.aegis_demo_reinit_transactions` (already relative-dated) after deleting/rebuilding demo_user ledger as needed so user_id=1 rows match setup seed with relative timestamps — extend `aegis_demo_reinit_transactions` if it currently only patches assets / cross-client inserts without fully reseeding user_id=1 rows from scratch.
4. Deletes and reloads `luxury_items` from reset-demo-data baseline.
5. `COMMIT` and return a clear `p_msg`.

`SYS.aegis_demo_control.initialize_demo_seed_data` wraps `ensure_pdb` + that procedure.

Keep seed credential literals identical to existing SQL files (no new passwords). Prefer extracting shared SQL into `sql/` included by both the grant script and `reset-demo-data.sql` when practical during apply; if extraction is too risky, duplicate once from reset-demo-data into the new procedure and leave a comment pointing both ways.

**Alternative considered:** Have Node read and execute `reset-demo-data.sql` via Thin driver — rejected (multi-statement SQL*Plus script with `@@`, prompts, container alters).

### 4. Relative dates

**Decision:** All reloaded `transactions.timestamp` values use `SYSTIMESTAMP - INTERVAL 'N' DAY` offsets already used in `Oracle_DB_Setup.sql` / `luminaforge_reinit_transactions.sql`. No absolute calendar dates. Portfolio and `luxury_items` have no date columns today — no change.

### 5. SPEC-aegis.md sync

**Decision:** During apply, extend §3 Layout / §3.1 to document the Command Nav action under Break-Glass Control and the full seed-init behavior (tables + relative dates + demo-control dependency).

## Risks / Trade-offs

- **[Risk] Full user password rewrite surprises presenters mid-demo** → Mitigation: explicit confirm copy naming users/roles/ledger/market tables; keep transaction-only button for lighter loops.
- **[Risk] Drift between `reset-demo-data.sql` and packaged procedure** → Mitigation: shared `sql/` include or comment-linked single source; tasks include parity check.
- **[Risk] `aegis_demo_reinit_transactions` incomplete for user_id=1 full wipe** → Mitigation: design requires verifying/extending that procedure so Initialize Demo Seed Data truly reseeds demo-user ledger, not only cross-client rows.
- **[Risk] Package version skew on VM** → Mitigation: bump version + header check; document re-run of `Oracle_DB_Demo_Control_Grant.sql` as SYS.
- **[Risk] Sidebar action without visible output console** → Mitigation: confirm + alert/status path when Break-Glass panel not mounted.

## Migration Plan

1. Deploy Aegis UI/API changes that know the new action (will error until package updated).
2. As SYS, re-run `Oracle_DB_Demo_Control_Grant.sql` (or focused grant delta) on demo PDB.
3. Smoke: break-glass login → Initialize Demo Seed Data → confirm → LuminaForge `/transactions` and Attack Point 3 UNION roster behave as seeded.
4. Rollback: remove sidebar button / action mapping; older package simply lacks procedure (harmless if UI reverted first).

## Open Questions

_(none — placement, naming “Seed”, and extending demo-control are fixed by the request and existing SPECs.)_
