## ADDED Requirements

### Requirement: Market Explorer supports column schema enumeration for a known table

The Market Explorer search SHALL accept a UNION injection payload against `user_tab_columns` filtered by `table_name`, returning column metadata in the same four-column shape as `luxury_items`, without changing the vulnerable concat in `searchLuxuryItems`.

#### Scenario: Column UNION payload returns column names and types

- **WHEN** a user submits `' AND 1=0 UNION SELECT ROWNUM, column_name || ' · ' || data_type, 0, 'COLUMNS' FROM user_tab_columns WHERE table_name = 'USERS' --` (or the same pattern with another table name from step 2)
- **THEN** the API SHALL return one row per column on that table
- **AND** each row SHALL expose `column_name` and `data_type` in the `name` field (formatted as `column · type`)
- **AND** each row SHALL have category `COLUMNS`
- **AND** the statement SHALL be eligible for logging in `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

#### Scenario: Step 3 does not alter steps 1–2 payloads

- **WHEN** a user runs the step-1 boolean or step-2 `user_tables` payloads
- **THEN** behavior SHALL remain as previously specified (no regression)

### Requirement: Market Explorer renders column discovery rows distinctly

When result rows include category `COLUMNS`, the results grid SHALL present column metadata, not luxury assets or table names.

#### Scenario: Column row display

- **WHEN** a search returns rows with category `COLUMNS`
- **THEN** the grid SHALL show the combined `column_name · data_type` label
- **AND** the category badge SHALL read `COLUMNS`
- **AND** price SHALL NOT be formatted as a luxury dollar amount (use “—” or equivalent)

#### Scenario: Column leak banner

- **WHEN** at least one result row has category `COLUMNS`
- **THEN** the results section SHALL display a visible warning that column schema was exposed via UNION injection

### Requirement: Market Explorer documents the three-step Attack Point 1 ladder

The `/market` page SHALL document step 1 (boolean), step 2 (tables), and step 3 (columns for a table).

#### Scenario: Three demo hints visible

- **WHEN** the user views the Market Explorer search card
- **THEN** hint text SHALL include all three payloads (boolean, `user_tables`, `user_tab_columns` with example table `USERS`)

#### Scenario: Click SCHEMA row to pre-fill step 3

- **WHEN** the user clicks a result row with category `SCHEMA`
- **THEN** the search input SHALL be populated with the step-3 column payload using that row’s table name
- **AND** the user MAY submit Search to execute the injection
