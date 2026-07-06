## MODIFIED Requirements

### Requirement: Market Explorer supports schema table enumeration via UNION injection

The Market Explorer search SHALL accept a UNION injection payload that queries Oracle `user_tables` and returns each `table_name` in the same result shape as Market search records (id, name, price, category), without modifying the vulnerable concat pattern in `searchLuxuryItems`.

#### Scenario: Schema UNION payload returns table names

- **WHEN** a user submits `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --` in the market search bar
- **THEN** the API SHALL return one row per accessible table in the current schema
- **AND** each row SHALL expose the Oracle table name in the `name` column and category `SCHEMA`
- **AND** the statement SHALL be eligible for logging in `SYS.DBA_SQL_FIREWALL_VIOLATIONS` for user `luminaforge`

#### Scenario: Benign search unchanged

- **WHEN** a user searches a normal investment term (for example `ORCL` or `bond`)
- **THEN** only matching market records SHALL be returned with investment categories (not `SCHEMA`)

### Requirement: Market Explorer renders schema discovery rows distinctly

When result rows include category `SCHEMA`, the results grid SHALL present them as schema metadata, not investment product listings.

#### Scenario: Schema row display

- **WHEN** a search returns rows with `category` (or `CATEGORY`) equal to `SCHEMA`
- **THEN** the grid SHALL show the table name as the primary label (from `name` / `NAME`)
- **AND** the category badge SHALL read `SCHEMA`
- **AND** price SHALL NOT be formatted as a market dollar amount (use “—” or equivalent)
