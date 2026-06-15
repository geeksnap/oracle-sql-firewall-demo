## Why

Live SQL Firewall demos require repeatedly toggling global and per-user firewall state, purging violation logs, and inspecting results—today that means switching to SQL*Plus or SQL Developer as SYS. A **Demo Control** panel inside Aegis Vault keeps presenters in one “wow” SOC UI and shows SQL plus results in a scrollable output console.

## What Changes

- Add a new sidebar Command NAV item: **Demo Control**.
- Four-panel layout on the Demo Control view:
  1. **System-wide Firewall Control** — global `DBMS_SQL_FIREWALL` actions (ENABLE/DISABLE, purge all relevant logs, view violations).
  2. **Aegis Vault Firewall Control** — per-user actions for `AEGIS_APP` (allow-list block on/off, disable allow-list, purge user violations, view status).
  3. **LuminaForge Firewall Control** — same button set for `luminaforge`.
  4. **Output** — large scrollable text area (~15 visible rows) showing executed SQL and execution results/errors.
- Backend API routes that run approved demo SQL as a privileged connection (SYS via definer procedures or dedicated demo-admin path); responses streamed into the Output panel.
- Cyberpunk glassmorphism styling consistent with existing Command NAV and SOC theme.
- After state-changing actions, trigger `FLUSH_LOGS` (when available) and nudge the existing violation poller so the dashboard updates quickly.

## Capabilities

### New Capabilities

- `demo-control`: Sidebar nav, UI layout (4 sections), demo action buttons, SQL execution API, and output console for SQL Firewall demonstration controls.

### Modified Capabilities

- _(none — no existing `openspec/specs/` baseline; behavior delta captured in `aegis-vault/SPEC-aegis.md` during apply)_

## Impact

- **aegis-vault/**: `Sidebar`, `page.tsx`, new `DemoControl` component, API routes under `/api/demo-control/*`, `lib/db/demo-control.ts` for SQL execution.
- **Database**: Requires SYS-level operations; extend `Oracle_DB_Aegis_Flush_Grant.sql` or add `Oracle_DB_Demo_Control_Grant.sql` with definer-rights procedures callable from `AEGIS_APP` (or a dedicated `AEGIS_DEMO_ADMIN` role).
- **Security**: Demo-only; all actions are explicit button-driven, no arbitrary SQL from the client.
- **LuminaForge**: No code changes; firewall user `luminaforge` controlled remotely from Aegis Vault APIs.
