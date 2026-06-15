## ADDED Requirements

### Requirement: Market Explorer search is a boolean-bypass injection point (Attack Point 1)

The system SHALL expose a "Lux-Asset / Ticker Universal Search Bar" in the main
navigation whose backend route (`POST /api/market/search`) builds its SQL by raw
string concatenation of the user input into a `WHERE name LIKE '%...%'` clause
against `luxury_items`, using NO bind variables, so a boolean payload bypasses
the filter.

#### Scenario: Benign search returns matching luxury items
- **WHEN** a user searches a normal term (e.g. `Rolex`)
- **THEN** the grid returns only `luxury_items` rows whose `name` matches, and no Firewall violation is required for benign training traffic

#### Scenario: Boolean bypass leaks all items
- **WHEN** a user submits `' OR '1'='1` into the search bar
- **THEN** the concatenated SQL evaluates true for every row and the grid returns ALL `luxury_items` (including hidden/unlisted), and the statement is recorded in `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

### Requirement: Transaction History filter is a conditional-exfiltration injection point (Attack Point 2)

The system SHALL provide a "Transaction Memo / Reference ID Filter" text field in
the advanced-search drawer whose backend route (`POST /api/transactions/filter`)
concatenates the raw input into a query scoped to the current user, with NO bind
variables, so an attacker can break out of the `user_id = 1` scope.

#### Scenario: Benign filter returns only the current user's transactions
- **WHEN** a user filters by a normal reference/type value
- **THEN** only `transactions` rows for `user_id = 1` matching that value are returned

#### Scenario: Conditional injection leaks other users' transactions
- **WHEN** a user submits a payload such as `x' OR user_id<>1 --`
- **THEN** the query returns `transactions` rows belonging to other users, and the statement is logged to `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

### Requirement: Custom Statement generator is a UNION-leak injection point (Attack Point 3)

The system SHALL provide a "Tax Institution ID" text input on the tax-document
download page whose backend route (`POST /api/statement/generate`) concatenates
the raw input into a numeric predicate against `transactions` with NO bind
variables, with a base SELECT whose column count and types are UNION-compatible
with `users(id, username, password, role)` (4 columns).

#### Scenario: Benign tax ID returns the user's statement rows
- **WHEN** a user enters a normal numeric Tax Institution ID
- **THEN** the statement grid renders that user's `transactions` rows

#### Scenario: UNION payload leaks credentials onto the statement grid
- **WHEN** a user submits `0 UNION SELECT id, username, password, role FROM users`
- **THEN** `users.username`, `users.password`, and `users.role` values (including the seeded `admin` row) are rendered into the formatted statement grid, and the statement is logged to `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

### Requirement: Quick Bulk Action memo is a stacked-query injection point (Attack Point 4)

The system SHALL provide a "Batch Execution Note" textarea in the bulk
asset-transfer flow whose backend route (`POST /api/bulk/execute`) concatenates
the raw note into SQL and splits on `;` to execute stacked statements, with NO
bind variables, enabling a second independent destructive command.

#### Scenario: Benign note completes the transfer normally
- **WHEN** a user enters a normal batch note
- **THEN** the bulk transfer records its `transactions` row and the UI shows "Transfer complete"

#### Scenario: Stacked query silently runs a destructive second command
- **WHEN** a user submits `ok'; UPDATE users SET role='admin' WHERE id=1 --`
- **THEN** both the intended INSERT and the injected UPDATE execute, the UI still shows a normal success message, and each statement is logged to `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

### Requirement: Vulnerable routes must avoid parameterized binds; the AI path must stay safe

The 4 attack routes SHALL deliberately avoid `node-oracledb` bind variables and
use raw string concatenation so they are 100% reproducibly injectable. The AI
assistant route (`POST /api/ai-query`) SHALL route through the Oracle SQLcl MCP
server and SHALL NOT concatenate user text into SQL.

#### Scenario: Vulnerable route uses no binds
- **WHEN** any of the 4 attack routes builds SQL
- **THEN** it concatenates the raw request value directly into the SQL string and calls `connection.execute` without bind arguments

#### Scenario: AI assistant path is not injectable
- **WHEN** a user sends a natural-language request to the Lumina AI assistant
- **THEN** the request is handled via the SQLcl MCP server and the same injection payloads do NOT leak data or run stacked statements
