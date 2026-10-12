## ADDED Requirements

### Requirement: Bootstrap expands SQL*Plus includes before execute
`scripts/oci-bootstrap-database.mjs` SHALL expand every SQL*Plus `@@relative/path.sql` include relative to the calling script before splitting or executing statements. It SHALL fail if an include file is missing or an `@@` line remains unresolved. It SHALL NOT skip `@@` lines.

#### Scenario: Setup creates AEGIS_DEMO_SEED before initialize
- **WHEN** bootstrap executes `Oracle_DB_Setup.sql`
- **THEN** it loads `sql/luminaforge_demo_seed.sql` (CREATE PACKAGE / PACKAGE BODY `luminaforge.aegis_demo_seed`)
- **AND** `luminaforge.aegis_demo_seed.initialize(...)` runs only after that package exists

#### Scenario: Demo Control includes are not silently dropped
- **WHEN** bootstrap executes `Oracle_DB_Demo_Control_Grant.sql`
- **THEN** it also loads `sql/luminaforge_bootstrap_benign.sql`, `sql/luminaforge_demo_seed_identity_migration.sql`, `sql/luminaforge_demo_seed.sql`, and `sql/luminaforge_reinit_transactions.sql`

#### Scenario: Missing include fails bootstrap
- **WHEN** a bootstrap SQL file references `@@` a path that does not exist on disk
- **THEN** bootstrap exits non-zero with an error that names the missing include
- **AND** it does not continue to a later `aegis_demo_seed.initialize` call
