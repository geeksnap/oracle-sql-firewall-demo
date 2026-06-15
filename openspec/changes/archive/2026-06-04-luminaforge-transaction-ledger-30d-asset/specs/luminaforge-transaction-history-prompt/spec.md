## MODIFIED Requirements

### Requirement: Search results emphasize cross-user exfiltration
When the backend returns transactions for multiple `user_id` values, the results table SHALL make **User ID** visible so presenters can demonstrate data leaked from other clients. The Ledger results table SHALL also include an **Asset** column showing the instrument or asset name for each transaction when the database provides it.

#### Scenario: Injection shows multiple users
- **WHEN** a successful injection returns rows where `user_id` is not `1`
- **THEN** those rows SHALL appear in the same results table with **User ID** populated
- **AND** the record count SHALL reflect all returned rows

#### Scenario: Benign search stays scoped to demo user
- **WHEN** the user submits a benign filter such as `BUY` or `TRANSFER`
- **THEN** only transactions for `user_id = 1` matching that type SHALL be shown (subject to seeded data)

#### Scenario: Ledger displays asset per row
- **WHEN** transaction rows include an `asset` field
- **THEN** the Ledger results table SHALL show the asset name in a dedicated **Asset** column for each row

## ADDED Requirements

### Requirement: Transaction History shows a 30-day records shortcut in the lookup panel
The institutional lookup panel SHALL expose a **Show all my last 30 days records** button in addition to the Search Ledger control.

#### Scenario: Shortcut is visible with lookup
- **WHEN** the user views the Transaction History lookup panel
- **THEN** a button labeled **Show all my last 30 days records** SHALL be visible
- **AND** it SHALL be visually distinct from the primary Search Ledger action (secondary/outline style)
