## ADDED Requirements

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
