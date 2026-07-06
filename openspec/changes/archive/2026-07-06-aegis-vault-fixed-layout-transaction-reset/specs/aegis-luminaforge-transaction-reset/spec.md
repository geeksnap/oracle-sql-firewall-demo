## ADDED Requirements

### Requirement: Break-Glass §3.3 provides Reinitialize default transaction data

LuminaForge **§3.3 Firewall setup** in Break-Glass Control SHALL include a demo-control button labeled **Reinitialize default transaction data**. Activating it SHALL restore `luminaforge.transactions` to the seeded demo baseline used on LuminaForge `/transactions` (demo user `user_id = 1` ledger rows unchanged in count/content class, cross-client rows for seeded users 3, 4, 5, 8, 9 restored, and any `type = 'BULK'` rows removed).

#### Scenario: Button visible in Firewall setup column

- **WHEN** the presenter views LuminaForge §3.3 Firewall setup after break-glass login
- **THEN** a button labeled **Reinitialize default transaction data** SHALL be present alongside existing setup actions

#### Scenario: Successful reset restores Transaction History baseline

- **WHEN** the presenter runs Attack Point 2 exfiltration (`x' OR user_id<>1 --`) and then clicks **Reinitialize default transaction data**
- **THEN** the demo-control console SHALL report success
- **AND** LuminaForge `/transactions` benign lookup (e.g. `BUY`) SHALL return only `user_id = 1` rows
- **AND** the cross-client seeded rows for users 3, 4, 5, 8, 9 SHALL be available again for a repeat exfiltration demo

#### Scenario: Reset does not alter user roles

- **WHEN** **Reinitialize default transaction data** completes after an Attack Point 4 role-escalation demo
- **THEN** `users.role` values SHALL remain whatever they were before the button was clicked
- **AND** only transaction table data SHALL be reinitialized

### Requirement: Transaction reset executes via whitelisted demo control

The **Reinitialize default transaction data** action SHALL invoke `SYS.aegis_demo_control.reinit_default_transaction_data` through the existing `POST /api/demo-control/execute` route with scope `luminaforge` and action `reinit-default-transaction-data`.

#### Scenario: Demo control executes PL/SQL procedure

- **WHEN** the presenter clicks **Reinitialize default transaction data**
- **THEN** Aegis Vault SHALL call `BEGIN SYS.aegis_demo_control.reinit_default_transaction_data(:msg); END;`
- **AND** the scrollable demo output console SHALL display the returned status message

#### Scenario: Action requires break-glass session

- **WHEN** an unauthenticated client posts `reinit-default-transaction-data` without a valid break-glass grant
- **THEN** the API SHALL reject the request and no transaction data SHALL change
