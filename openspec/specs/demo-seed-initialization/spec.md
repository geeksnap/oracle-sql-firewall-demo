# demo-seed-initialization Specification

## Purpose
Defines safe, repeatable restoration of the paired demo's LuminaForge business dataset, including deterministic rebasing of seeded temporal values to a current anchor.

## Requirements

### Requirement: Initialization has an explicit demo-only boundary
The system SHALL run seed initialization only when demo-reset mode is explicitly enabled and the configured target is the `LUMINAFORGE` demo schema. It SHALL reject ambiguous, production, alternate-schema, or disabled targets before deleting data.

#### Scenario: Demo reset is disabled
- **WHEN** an authorized client requests initialization while demo-reset mode is not explicitly enabled
- **THEN** the request is rejected before any database mutation
- **AND** the response states that demo seed initialization is disabled

#### Scenario: Target schema is not the demo schema
- **WHEN** the configured reset target does not normalize exactly to `LUMINAFORGE`
- **THEN** the request is rejected before any database mutation
- **AND** no dynamically supplied schema or table name is executed

### Requirement: Initialization restores the complete current business seed
The action SHALL replace seed data in `LUMINAFORGE.USERS`, `PORTFOLIO`, `TRANSACTIONS`, and `LUXURY_ITEMS` with the canonical repository seed manifest. It SHALL NOT alter Aegis data, Oracle SQL Firewall policy/capture/allow-list state, violation logs, or in-memory break-glass events.

#### Scenario: Successful complete reset
- **WHEN** any of the four scoped tables contains mutated, missing, or extra rows and initialization succeeds
- **THEN** all four tables match the canonical seeded users, roles, credentials, positions, transactions, and market instruments
- **AND** stable seed identifiers preserve the LuminaForge demo contract, including `demo_user` as user ID 1

#### Scenario: Aegis and firewall state remain unchanged
- **WHEN** initialization succeeds
- **THEN** Aegis operational data and synthetic break-glass events are unchanged
- **AND** SQL Firewall global state, captures, allow-lists, enforcement, and violation logs are unchanged

### Requirement: Replacement is atomic and foreign-key safe
The database SHALL perform scoped deletes and inserts in one transaction, deleting child rows before parents and inserting parents before children. Any error SHALL roll back all scoped changes and return failure without reporting partial success.

#### Scenario: Foreign keys are present
- **WHEN** the scoped schema enforces user relationships from `TRANSACTIONS` and `PORTFOLIO`
- **THEN** initialization deletes `TRANSACTIONS` and `PORTFOLIO` before `USERS`
- **AND** it inserts `USERS` before rows that reference users

#### Scenario: Seed insert fails
- **WHEN** any delete, insert, validation, or commit step fails
- **THEN** the transaction is rolled back
- **AND** all four tables retain their complete pre-request state
- **AND** the caller receives a failure message suitable for the Aegis output console

### Requirement: Initialization is repeatable and validates its result
Each successful run SHALL converge on one canonical row set relative to that run's captured target anchor. Before commit, the system SHALL validate required identities, referential integrity, expected row counts, and temporal invariants.

#### Scenario: Repeated run at the same anchor
- **WHEN** initialization is executed twice with the same injected target anchor in a test
- **THEN** the second result is identical to the first, including identifiers and temporal values
- **AND** no duplicate rows exist

#### Scenario: Post-load validation fails
- **WHEN** loaded row counts or required seed identities differ from the canonical manifest
- **THEN** initialization fails and rolls back
- **AND** the error identifies the failed validation without exposing credentials

### Requirement: Seed dates rebase from one declared source anchor
The canonical seed manifest SHALL declare `2026-06-01T00:00:00.000Z` as its source anchor. One target anchor SHALL be captured at action start from the Oracle database clock in UTC, and every non-null seeded temporal value SHALL be derived from those two anchors.

#### Scenario: Historical value remains historical
- **WHEN** a source value is one calendar month before the source anchor
- **THEN** its rebased value is one calendar month before the target anchor

#### Scenario: Future value remains future
- **WHEN** a source value is ten days after the source anchor
- **THEN** its rebased value is ten days after the target anchor

#### Scenario: Null value remains null
- **WHEN** a seeded temporal field is null
- **THEN** initialization stores null and does not substitute either anchor

#### Scenario: One anchor is used throughout a run
- **WHEN** initialization spans a database-clock boundary
- **THEN** all rows are still calculated from the single target anchor captured at action start

### Requirement: Rebasing preserves calendar and timestamp semantics
Calendar month offsets SHALL be applied before residual day/time offsets, preserving last-day-of-month classification. UTC SHALL govern aware values; naive `DATE`/`TIMESTAMP` values SHALL use a UTC database session. The original Oracle type, fractional precision, and signed offset SHALL be preserved.

#### Scenario: End-of-month source value
- **WHEN** a source value is the last day of its month at a given time
- **THEN** the rebased value is the last day of the corresponding target-relative month at that time

#### Scenario: Non-month duration value
- **WHEN** a source value is 36 hours before the source anchor
- **THEN** the rebased value is exactly 36 hours before the target anchor

#### Scenario: Time-zone-aware value crosses daylight-saving time
- **WHEN** a source value has time-zone information and rebasing crosses a daylight-saving boundary
- **THEN** its instant offset from the UTC anchor is preserved without an implicit server-local-time conversion

#### Scenario: Deterministic temporal test
- **WHEN** a test supplies `2027-03-31T12:34:56.789Z` as the target anchor
- **THEN** every expected value is computed from that exact instant with no dependency on the test runner clock

### Requirement: Outcome is observable without leaking secrets
A successful response SHALL report the UTC target anchor and per-table row counts. A failed response SHALL report a safe error and rollback status. Neither response nor application logs SHALL include seeded passwords, database credentials, or submitted break-glass passwords.

#### Scenario: Success feedback
- **WHEN** initialization commits
- **THEN** Aegis displays success, the target anchor, and row counts for all four scoped tables

#### Scenario: Failure feedback
- **WHEN** initialization rolls back
- **THEN** Aegis displays failure and confirms that no partial reset was committed
- **AND** secrets are absent from the response and logs
