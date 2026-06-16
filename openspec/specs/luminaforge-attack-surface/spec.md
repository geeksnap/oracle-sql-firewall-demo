# luminaforge-attack-surface Specification

## Purpose
LuminaForge intentional SQL injection demo endpoints for Oracle SQL Firewall training.
## Requirements
### Requirement: Market Explorer search is a boolean-bypass injection point (Attack Point 1)

The system SHALL expose a "Lux-Asset / Ticker Universal Search Bar" in the main
navigation whose backend route (`POST /api/market/search`) builds its SQL by raw
string concatenation of the user input into a `WHERE name LIKE '%...%'` clause
against `luxury_items`, using NO bind variables, so a boolean payload bypasses
the filter. The same endpoint SHALL also support UNION-based schema-discovery
payloads: listing table names from `user_tables` (step 2) and listing column
names and data types from `user_tab_columns` for a chosen table (step 3).

#### Scenario: Benign search returns matching luxury items
- **WHEN** a user searches a normal term (e.g. `Rolex`)
- **THEN** the grid returns only `luxury_items` rows whose `name` matches, and no Firewall violation is required for benign training traffic

#### Scenario: Boolean bypass leaks all items
- **WHEN** a user submits `' OR '1'='1` into the search bar
- **THEN** the concatenated SQL evaluates true for every row and the grid returns ALL `luxury_items` (including hidden/unlisted), and the statement is recorded in `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

#### Scenario: UNION schema discovery lists application tables
- **WHEN** a user submits `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --` into the search bar
- **THEN** the grid returns rows whose primary label is each Oracle `table_name` in the current schema (e.g. `USERS`, `TRANSACTIONS`, `LUXURY_ITEMS`, `PORTFOLIO`)
- **AND** those rows are tagged with category `SCHEMA` in the API response
- **AND** the statement is recorded in `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

#### Scenario: UNION column discovery lists columns for a table
- **WHEN** a user submits a step-3 payload such as `' AND 1=0 UNION SELECT ROWNUM, column_name || ' · ' || data_type, 0, 'COLUMNS' FROM user_tab_columns WHERE table_name = 'USERS' --`
- **THEN** the grid returns rows for each column on that table with category `COLUMNS`
- **AND** the statement is recorded in `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

### Requirement: Transaction History filter is a conditional-exfiltration injection point (Attack Point 2)

The system SHALL provide a primary **Transaction History ledger lookup** prompt on `/transactions` (replacing the legacy collapsible “Transaction Memo / Reference ID Filter” drawer). The prompt SHALL POST to `POST /api/transactions/filter`, which concatenates the raw input into a query scoped to the current user (`user_id = 1`) via a `type = '...'` predicate, with NO bind variables, so an attacker can break out of the scope and retrieve **all users’** rows in the `transactions` table.

#### Scenario: Benign filter returns only the current user's transactions
- **WHEN** a user searches with a normal transfer type or reference value (e.g. `BUY`, `TRANSFER`)
- **THEN** only `transactions` rows for `user_id = 1` matching that value are returned

#### Scenario: Conditional injection leaks other users' transactions
- **WHEN** a user submits a payload such as `x' OR user_id<>1 --` in the ledger lookup prompt
- **THEN** the query returns `transactions` rows for other seeded users (e.g. `user_id` 3, 4, 5, 8, 9) in addition to or instead of the demo user’s rows
- **AND** the statement is logged to `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

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
- **WHEN** a user submits `0 UNION SELECT TO_CHAR(id), username, password, role FROM users`
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

### Requirement: Transaction History supports XML/hex WAF-bypass demo payload

Attack Point 2 SHALL document an optional XML/hex obfuscation payload using Oracle `REGEXP_LIKE`, `DBMS_XMLGEN.GETXMLTYPE`, `utl_raw.cast_to_varchar2`, and `HEXTORAW`, pasteable from the Transaction History ledger lookup UI, that evades OCI WAF query-string rules while still executing via the existing `POST /api/transactions/filter` concatenation. The canonical payload `x' OR user_id<>1 --` SHALL remain the primary demo hint and SHALL retain its documented behavior on the direct `:3001` path.

#### Scenario: Canonical Attack Point 2 payload unchanged on direct path
- **WHEN** a user submits `x' OR user_id<>1 --` on `http://<compute_public_ip>:3001/transactions`
- **THEN** cross-user `transactions` rows are returned as before
- **AND** SQL Firewall violations are recorded for `luminaforge`

#### Scenario: XML/hex payload available as secondary UI hint
- **WHEN** a presenter views the Transaction History ledger lookup
- **THEN** a secondary monospace hint displays the complete XML/hex WAF-bypass payload constant
- **AND** the primary hint still shows `x' OR user_id<>1 --`

#### Scenario: XML/hex payload does not alter vulnerable SQL template
- **WHEN** any payload is submitted to `POST /api/transactions/filter`
- **THEN** `filterTransactions` still builds SQL only via the existing `type = '${ref}'` string concatenation with no server-side decoding or special cases

### Requirement: Market Explorer supports WAF-bypass demo payload (Attack Point 1 step 1)

Attack Point 1 SHALL document an optional WAF-evasion payload for the boolean bypass (`' OR '1'='1`) using comment obfuscation (`/**/OR/**/`) and/or the same `REGEXP_LIKE` / `DBMS_XMLGEN` / `HEXTORAW` technique used on Attack Point 2, pasteable from the Market Explorer search UI. Canonical step 1–3 recon payloads SHALL remain the primary hints. Steps 2–3 (UNION / `user_tables` / `user_tab_columns`) MAY remain WAF-blocked on the LB URL.

#### Scenario: Canonical boolean bypass unchanged on direct path
- **WHEN** a user submits `' OR '1'='1` on `http://<compute_public_ip>:3001/market`
- **THEN** all `luxury_items` rows are returned as before
- **AND** SQL Firewall violations are recorded for `luminaforge`

#### Scenario: WAF-bypass boolean payload on LB URL
- **WHEN** a presenter submits the documented WAF-bypass payload from the Market UI on `http://<lb_public_ip>/market`
- **THEN** OCI WAF returns **200**
- **AND** all `luxury_items` rows are returned

### Requirement: Custom Statement supports WAF-bypass demo payload (Attack Point 3)

Attack Point 3 SHALL document an optional WAF-evasion payload pasteable from the Tax Institution ID field when Tier B engineering produces a working constant. The canonical `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` payload SHALL remain the primary hint. If no WAF bypass is achievable without code changes, the secondary hint SHALL state that the canonical credential-leak payload is blocked on the LB URL and `:3001` must be used.

#### Scenario: Canonical UNION credential leak unchanged on direct path
- **WHEN** a user submits `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` on `:3001`
- **THEN** user credential rows are returned as before

#### Scenario: WAF-bypass credential payload when engineered
- **WHEN** a presenter submits the documented Attack Point 3 WAF-bypass payload on the LB URL
- **THEN** OCI WAF returns **200**
- **AND** user credential rows are returned (same outcome class as canonical UNION attack)

### Requirement: Bulk Action supports WAF-bypass demo payload (Attack Point 4)

Attack Point 4 SHALL document an optional WAF-evasion payload pasteable from the batch execution note field when Tier B engineering produces a working constant. The canonical `; UPDATE users SET role='admin' WHERE id=1 --` payload SHALL remain the primary hint. If no WAF bypass is achievable, the secondary hint SHALL document WAF blocking and `:3001` fallback.

#### Scenario: Canonical stacked UPDATE unchanged on direct path
- **WHEN** a user submits `; UPDATE users SET role='admin' WHERE id=1 --` on `:3001`
- **THEN** role escalation occurs and `GET /api/session` reflects `role=admin`

#### Scenario: WAF-bypass role escalation when engineered
- **WHEN** a presenter submits the documented Attack Point 4 WAF-bypass payload on the LB URL
- **THEN** OCI WAF returns **200**
- **AND** `GET /api/session` reflects `role=admin` after the attack

