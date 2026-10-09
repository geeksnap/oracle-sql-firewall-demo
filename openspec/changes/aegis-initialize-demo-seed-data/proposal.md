# Proposal

## Why

Presenters need a one-click way to restore the full LuminaForge demo dataset (not only transactions) after attack rehearsals leave roles, portfolios, market rows, or ledger timestamps stale. A dedicated **Initialize Demo Seed Data** control under **Break-Glass Control** makes that reset visible and safe without re-running `Oracle_DB_Setup.sql` or SQL*Plus.

## What Changes

- Add a Command Nav action button labeled **Initialize Demo Seed Data** directly beneath the **Break-Glass Control** nav button (non-navigational; does not add a third Command Nav section).
- On press (after break-glass grant + confirm): delete demo-table contents that participate in the seed baseline, reload seed rows aligned with `Oracle_DB_Setup.sql` / `luminaforge/scripts/reset-demo-data.sql`, and stamp transaction timestamps relative to current DB time (`SYSTIMESTAMP - INTERVAL 'N' DAY`).
- Extend `SYS.aegis_demo_control` with a whitelisted procedure invoked via existing `POST /api/demo-control/execute` (new action enum), rather than inventing a separate privileged API.
- Keep existing **Reinitialize default transaction data** (§3.3) for transaction-only rehearsal loops; the new control is the fuller seed path presenters use when the whole demo DB must be restored.
- Update `aegis-vault/SPEC-aegis.md` Break-Glass / Command Nav wording to document the button and behavior.
- Bump demo-control package version expectation in the app header after the grant script change.

## Capabilities

### New Capabilities

- `aegis-demo-seed-init`: Command Nav placement under Break-Glass Control, confirm + break-glass gate, full LuminaForge demo-table delete/reload with relative dates via whitelisted demo-control.

### Modified Capabilities

- `aegis-command-nav`: Allow a non-navigational **Initialize Demo Seed Data** action control under **Break-Glass Control** while keeping navigable sections limited to Dashboard + Break-Glass Control.
- `aegis-break-glass-control`: Require a valid break-glass grant before the seed-init action runs (prompt login if missing).

## Impact

- **aegis-vault/**: `Sidebar.tsx` (button under Break-Glass Control), break-glass / page wiring for auth gate + confirm, `demo-control-types.ts`, `lib/db/demo-control.ts`, demo-control execute route.
- **Database**: Extend `Oracle_DB_Demo_Control_Grant.sql` / shared SQL under `sql/` (prefer wrapping `reset-demo-data.sql` + `luminaforge_reinit_transactions.sql` patterns) with `initialize_demo_seed_data` (name TBD in design) callable by `AEGIS_APP`.
- **LuminaForge app code**: No UI changes required; data restored in Oracle tables `users`, `portfolio`, `transactions`, `luxury_items`.
- **Docs**: `aegis-vault/SPEC-aegis.md`; optional briefing script note that full seed init differs from transaction-only reinit.
- **Security**: No new secrets; reuse existing demo seed credentials already present in setup/reset SQL. Demo-only definer package; confirm dialog for destructive reload.
