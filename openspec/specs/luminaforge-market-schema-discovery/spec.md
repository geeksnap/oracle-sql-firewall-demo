# luminaforge-market-schema-discovery Specification

## Purpose
TBD - created by archiving change luminaforge-market-explorer-schema-tables. Update Purpose after archive.
## Requirements
### Requirement: Market Explorer supports schema table enumeration via UNION injection

The Market Explorer search SHALL accept a UNION injection payload that queries Oracle `user_tables` and returns each `table_name` in the same result shape as `luxury_items` (id, name, price, category), without modifying the vulnerable concat pattern in `searchLuxuryItems`.

#### Scenario: Schema UNION payload returns table names

- **WHEN** a user submits `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --` in the Lux-Asset search bar
- **THEN** the API SHALL return one row per accessible table in the current schema
- **AND** each row SHALL expose the Oracle table name in the `name` column and category `SCHEMA`
- **AND** the statement SHALL be eligible for logging in `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

#### Scenario: Benign search unchanged

- **WHEN** a user searches a normal term (e.g. `Rolex`)
- **THEN** only matching `luxury_items` rows SHALL be returned with real asset categories (not `SCHEMA`)

### Requirement: Market Explorer renders schema discovery rows distinctly

When result rows include category `SCHEMA`, the results grid SHALL present them as schema metadata, not luxury product listings.

#### Scenario: Schema row display

- **WHEN** a search returns rows with `category` (or `CATEGORY`) equal to `SCHEMA`
- **THEN** the grid SHALL show the table name as the primary label (from `name` / `NAME`)
- **AND** the category badge SHALL read `SCHEMA`
- **AND** price SHALL NOT be formatted as a luxury dollar amount (use “—” or equivalent)

#### Scenario: Schema leak banner

- **WHEN** at least one result row has category `SCHEMA`
- **THEN** the results section SHALL display a visible warning that schema metadata was exposed via UNION injection

### Requirement: Market Explorer documents both Attack Point 1 payloads

The `/market` page SHALL document the full Attack Point 1 recon ladder: step 1 boolean bypass, step 2 table enumeration, and step 3 column enumeration for a table discovered in step 2.

#### Scenario: Three demo hints visible

- **WHEN** the user views the Market Explorer search card
- **THEN** hint text SHALL include the boolean payload `' OR '1'='1`
- **AND** hint text SHALL include the schema UNION payload `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --`
- **AND** hint text SHALL include the column UNION payload with example table `USERS`

#### Scenario: Click SCHEMA row pivots to step 3

- **WHEN** the user clicks a `SCHEMA` result row showing a table name
- **THEN** the search input SHALL be filled with the step-3 `user_tab_columns` payload for that table name

