# luminaforge-transaction-ledger-recent Specification

## Purpose
TBD - created by archiving change luminaforge-transaction-ledger-30d-asset. Update Purpose after archive.
## Requirements
### Requirement: Transaction History provides a 30-day ledger shortcut for the demo user
The Transaction History page SHALL include a control labeled **Show all my last 30 days records** that loads the current demo user's transactions from the last 30 days into the **Ledger results** table without using the vulnerable lookup input.

#### Scenario: User clicks 30-day shortcut
- **WHEN** the user clicks **Show all my last 30 days records**
- **THEN** the application SHALL request recent transactions for `user_id = 1` within the last 30 days
- **AND** the Ledger results table SHALL update with the returned rows
- **AND** the results header SHALL read **Ledger results**

#### Scenario: 30-day query uses safe parameterized SQL
- **WHEN** the recent-transactions API executes
- **THEN** it SHALL use `oracledb` bind variables for `user_id` and day interval
- **AND** it SHALL NOT concatenate user input into SQL text

### Requirement: Recent ledger API returns asset with each row
The recent-transactions API SHALL return `asset` (when present in the database) alongside id, user_id, type, amount, and timestamp for each row.

#### Scenario: Seeded demo user rows include asset
- **WHEN** the demo database has `asset` populated on `transactions` for `user_id = 1`
- **THEN** each row returned by the 30-day shortcut SHALL include a non-empty `asset` value in the API response

