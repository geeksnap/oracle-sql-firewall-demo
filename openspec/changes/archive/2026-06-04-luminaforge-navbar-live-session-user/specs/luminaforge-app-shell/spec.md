## MODIFIED Requirements

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
