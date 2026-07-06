## Why

During live SQL Firewall demos, Aegis Vault panels grow vertically as violations accumulate, and Break-Glass Control shifts width when the output console expands — making the SOC layout feel unstable. Presenters also need a one-click way to restore LuminaForge Transaction History to its seeded baseline after Attack Point 2 exfiltration demos, without running SQL scripts manually.

## What Changes

- Lock the Aegis Vault shell to a fixed viewport size at startup (consistent width and height across Dashboard and Break-Glass Control).
- Constrain **Latest Threats** and **Live Violations** to fixed-height panels with internal vertical scrollbars; new violations SHALL NOT grow the page or adjacent columns.
- Stabilize Break-Glass Control center column width so switching sections and appending demo-control output does not resize the application frame.
- Add **Reinitialize default transaction data** button in LuminaForge §3.3 Firewall setup that restores `luminaforge.transactions` to the seeded baseline (demo user ledger + cross-client rows) visible on LuminaForge `/transactions`.

## Capabilities

### New Capabilities

- `aegis-fixed-viewport-shell`: Fixed outer shell dimensions and overflow behavior for the entire Aegis Vault app from first paint.
- `aegis-luminaforge-transaction-reset`: Break-Glass demo-control action and UI button to re-seed LuminaForge transaction data.

### Modified Capabilities

- `aegis-dashboard-threats-height`: Strengthen fixed-height + internal scroll for Latest Threats so violation growth never expands the layout.
- `aegis-live-violations-compact`: Strengthen fixed-height + internal scroll for the right-rail Live Violations panel.
- `aegis-ui-layout-polish`: Break-Glass Control section SHALL not cause horizontal layout shift relative to Dashboard.

## Impact

- Affected code: `aegis-vault/src/app/page.tsx`, `aegis-vault/src/components/ViolationsTable.tsx`, `aegis-vault/src/components/ViolationsWithFullSql.tsx`, `aegis-vault/src/components/DemoControlPanel.tsx`, `aegis-vault/src/components/LuminaforgeFirewallControlCenter.tsx`, `aegis-vault/lib/demo-control-types.ts`, `aegis-vault/lib/db/demo-control.ts`
- Database: new `SYS.aegis_demo_control.reinit_default_transaction_data` procedure in `Oracle_DB_Demo_Control_Grant.sql` (transaction-only subset of `luminaforge/scripts/reset-demo-data.sql`); package version bump
- No LuminaForge UI changes required beyond data refresh visible on `/transactions` after reset
