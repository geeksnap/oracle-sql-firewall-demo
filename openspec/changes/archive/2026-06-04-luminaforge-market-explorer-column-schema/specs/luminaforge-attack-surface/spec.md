## MODIFIED Requirements

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
