## ADDED Requirements

### Requirement: Navbar navigation does not spuriously trigger firewall context violations

After **Initialize default demo policy** has completed successfully (with LuminaForge running during init), routine navbar tab navigation SHALL NOT cause Oracle SQL Firewall **Context violation** log entries attributable to session-context mismatch for user `luminaforge`.

#### Scenario: Tab switch after successful default policy init

- **WHEN** default demo policy was initialized with LuminaForge reachable
- **AND** the presenter switches between LuminaForge nav tabs (Dashboard, Market, Transactions, Statement, Portfolio)
- **THEN** Aegis Vault SHALL NOT show new **Context violation** rows with empty SQL solely from that navigation

#### Scenario: Context violations are not SQL injection

- **WHEN** Aegis shows **Type = Context violation** and **FULL SQL** is empty
- **THEN** that row reflects session attribute mismatch (client program, IP, OS user), not a missing or blocked SQL statement from an attack point
