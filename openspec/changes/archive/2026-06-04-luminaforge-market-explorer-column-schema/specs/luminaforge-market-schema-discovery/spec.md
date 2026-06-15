## MODIFIED Requirements

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
