# luminaforge-session-identity Specification

## Purpose
Safe demo session identity for the LuminaForge navbar — live `username` and `role` from Oracle `users` for Attack Point 4 privilege-escalation feedback.

## Requirements

### Requirement: Demo session identity is loaded safely from users

The system SHALL expose a safe read path that returns `username` and `role` for the LuminaForge demo session user (`users.id = 1`) using `oracledb` bind variables, not string concatenation.

#### Scenario: Session API returns demo user row

- **WHEN** the client calls `GET /api/session`
- **THEN** the response SHALL include `username` and `role` from the `users` table for `id = 1`
- **AND** the query SHALL use a bind variable for `user_id`

#### Scenario: Missing user handled gracefully

- **WHEN** no row exists for `id = 1`
- **THEN** the API SHALL return a sensible fallback or error without throwing an unhandled exception

### Requirement: Navbar displays live username and role

The global LuminaForge header (upper right) SHALL show the current `username` and `role` from the session API instead of a hardcoded label.

#### Scenario: Navbar shows seeded demo user

- **WHEN** the app loads and `users.id = 1` has `username = demo_user` and `role = premium`
- **THEN** the header SHALL display `demo_user` and the role `premium` (or equivalent visible role label)

#### Scenario: Navbar reflects role change after Attack Point 4

- **WHEN** `users.role` for `id = 1` is updated to `admin` (e.g. via stacked bulk attack) and the client refetches session identity
- **THEN** the header role display SHALL update to `admin` without requiring a code change

#### Scenario: Session identity refreshes on navigation

- **WHEN** the user navigates between LuminaForge routes or refocuses the browser window
- **THEN** the navbar SHALL re-request session identity so post-attack role changes can appear

### Requirement: Navbar navigation does not spuriously trigger firewall context violations

After **Initialize default demo policy** has completed successfully (with LuminaForge running during init), routine navbar tab navigation SHALL NOT cause Oracle SQL Firewall **Context violation** log entries attributable to session-context mismatch for user `luminaforge`.

#### Scenario: Tab switch after successful default policy init

- **WHEN** default demo policy was initialized with LuminaForge reachable
- **AND** the presenter switches between LuminaForge nav tabs (Dashboard, Market, Transactions, Statement, Portfolio)
- **THEN** Aegis Vault SHALL NOT show new **Context violation** rows with empty SQL solely from that navigation

#### Scenario: Context violations are not SQL injection

- **WHEN** Aegis shows **Type = Context violation** and **FULL SQL** is empty
- **THEN** that row reflects session attribute mismatch (client program, IP, OS user), not a missing or blocked SQL statement from an attack point
