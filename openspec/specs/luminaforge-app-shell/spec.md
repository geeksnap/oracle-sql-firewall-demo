## ADDED Requirements

### Requirement: LuminaForge runs as an independent Next.js 15 app

The system SHALL implement LuminaForge as a standalone Next.js 15 App Router
application under `./luminaforge` with its own `.env`, its own custom server, and
a port distinct from Aegis Vault (default `3001`), so both apps run concurrently
during the demo without collision.

#### Scenario: LuminaForge starts without colliding with Aegis Vault
- **WHEN** LuminaForge and Aegis Vault are both started
- **THEN** LuminaForge listens on port `3001`, Aegis Vault on `3000`, and neither raises `EADDRINUSE`

#### Scenario: LuminaForge connects as the luminaforge DB user
- **WHEN** the LuminaForge server boots
- **THEN** it connects to PDB `AHDB2605_PDB1` as `DB_USER=luminaforge` via `oracledb` Thin Mode, closing connections in a `finally` block

### Requirement: Dark Luxury fintech UI with the required screens

The system SHALL present a Dark Luxury Fintech theme (navy `#0f172a`, gold
`#f4c95d`, neon cyan) and provide the Dashboard, Market Explorer, Transaction
History, Custom Statement, and Bulk Action screens, plus a floating Lumina AI
assistant widget. The global navigation header SHALL display the live demo
session **username** and **role** from the `users` table (safe read, `user_id = 1`),
not a hardcoded username string.

#### Scenario: Core screens are reachable
- **WHEN** a user navigates LuminaForge
- **THEN** Dashboard (with 3D portfolio globe + price ticker), Market Explorer, Transaction History, Custom Statement, and Bulk Action screens are all reachable, each hosting its respective camouflaged attack input

#### Scenario: Attack inputs look like ordinary product features
- **WHEN** a user views any attack input
- **THEN** it is labeled as a normal fintech feature (universal search, memo/reference filter, tax institution ID, batch execution note) with no indication it is an injection point

#### Scenario: Navbar shows database-backed session identity
- **WHEN** a user views any LuminaForge screen
- **THEN** the upper-right header SHALL show `username` and `role` for the demo session user loaded from Oracle `users`

### Requirement: Queries map onto the verified luminaforge schema

The system SHALL only query the deployed tables `users`, `portfolio`,
`transactions`, and `luxury_items` and their verified columns; it SHALL NOT alter
`Oracle_DB_Setup.sql` or the schema, and SHALL ship a reset/reseed script for the
destructive Attack Point 4.

#### Scenario: All routes reference existing columns
- **WHEN** any route executes SQL
- **THEN** every referenced table and column exists in the verified schema (per `demo_schema_Creation_20260601.log`)

#### Scenario: Demo data can be reset after destructive attack
- **WHEN** the presenter runs `scripts/reset-demo-data.sql` after an Attack Point 4 demo
- **THEN** the `users` rows (including `demo_user`/`Wealth#2026!`/`premium` and `admin`/`Sup3rSecretAdmin#`/`admin`), `transactions`, and related rows are restored to their seeded baseline for a repeatable demo
