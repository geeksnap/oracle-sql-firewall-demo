## MODIFIED Requirements

### Requirement: Transaction History filter is a conditional-exfiltration injection point (Attack Point 2)

The system SHALL provide a primary **Transaction History ledger lookup** prompt on `/transactions` (replacing the legacy collapsible “Transaction Memo / Reference ID Filter” drawer). The prompt SHALL POST to `POST /api/transactions/filter`, which concatenates the raw input into a query scoped to the current user (`user_id = 1`) via a `type = '...'` predicate, with NO bind variables, so an attacker can break out of the scope and retrieve **all users’** rows in the `transactions` table.

#### Scenario: Benign filter returns only the current user's transactions
- **WHEN** a user searches with a normal transfer type or reference value (e.g. `BUY`, `TRANSFER`)
- **THEN** only `transactions` rows for `user_id = 1` matching that value are returned

#### Scenario: Conditional injection leaks other users' transactions
- **WHEN** a user submits a payload such as `x' OR user_id<>1 --` in the ledger lookup prompt
- **THEN** the query returns `transactions` rows for other seeded users (e.g. `user_id` 3, 4, 5, 8, 9) in addition to or instead of the demo user’s rows
- **AND** the statement is logged to `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`
