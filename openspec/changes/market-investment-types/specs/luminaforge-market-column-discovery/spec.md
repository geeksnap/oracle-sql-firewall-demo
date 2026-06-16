## MODIFIED Requirements

### Requirement: Market Explorer supports column schema enumeration for a known table

The Market Explorer search SHALL accept a UNION injection payload against `user_tab_columns` filtered by `table_name`, returning column metadata in the same four-column shape as Market search records, without changing the vulnerable concat in `searchLuxuryItems`.

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

When result rows include category `COLUMNS`, the results grid SHALL present column metadata, not investment instruments or table names.

#### Scenario: Column row display

- **WHEN** a search returns rows with category `COLUMNS`
- **THEN** the grid SHALL show the combined `column_name · data_type` label
- **AND** the category badge SHALL read `COLUMNS`
- **AND** price SHALL NOT be formatted as a market dollar amount (use “—” or equivalent)
