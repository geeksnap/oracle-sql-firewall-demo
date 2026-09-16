## RENAMED Requirements

### Requirement: Transaction History provides a latest-10 ledger shortcut for the demo user
- FROM: `### Requirement: Transaction History provides a 30-day ledger shortcut for the demo user`
- TO: `### Requirement: Transaction History provides a latest-10 ledger shortcut for the demo user`

## MODIFIED Requirements

### Requirement: Transaction History provides a latest-10 ledger shortcut for the demo user
The Transaction History page SHALL include a control labeled **Show all my latest 10 transaction records** that loads the current demo user's 10 most recent transactions into the **Ledger results** table without using the vulnerable lookup input. The shortcut SHALL be date-independent: it MUST NOT filter rows by any time window, so it returns results regardless of how old the seed data is.

#### Scenario: User clicks latest-10 shortcut
- **WHEN** the user clicks **Show all my latest 10 transaction records**
- **THEN** the application SHALL request the most recent transactions for `user_id = 1` ordered newest-first
- **AND** at most 10 rows SHALL be returned
- **AND** the Ledger results table SHALL update with the returned rows
- **AND** the results header SHALL read **Ledger results**

#### Scenario: Shortcut is not affected by seed-data age
- **WHEN** all of the demo user's seeded transactions are older than 30 days
- **THEN** clicking **Show all my latest 10 transaction records** SHALL still return up to 10 rows
- **AND** the query SHALL NOT apply any `timestamp`-based date filter

#### Scenario: Latest-10 query uses safe parameterized SQL
- **WHEN** the recent-transactions API executes
- **THEN** it SHALL use `oracledb` bind variables for `user_id` and the row limit
- **AND** it SHALL NOT concatenate user input into SQL text
