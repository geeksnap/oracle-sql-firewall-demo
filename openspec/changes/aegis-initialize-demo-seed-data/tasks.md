# Tasks

## 1. Canonical seed model and application specifications

- [ ] 1.1 Create one canonical manifest for `LUMINAFORGE.USERS`, `PORTFOLIO`, `TRANSACTIONS`, and `LUXURY_ITEMS`, including stable IDs, expected counts, the `2026-06-01T00:00:00.000Z` source anchor, and temporal offset metadata; verify a manifest test rejects duplicate IDs, broken user references, or an undeclared temporal column.
- [ ] 1.2 Generate or refactor `Oracle_DB_Setup.sql`, `luminaforge/scripts/reset-demo-data.sql`, and transaction-reset fixtures to consume the canonical values without drift; verify a repository drift check passes and no generated file contains environment credentials.
- [ ] 1.3 Update `aegis-vault/SPEC-aegis.md` with the guarded sidebar control and update `luminaforge/SPEC-luminaforge.md` with the four-table reset/date contract; verify both canonical specs agree with the OpenSpec deltas and retain existing attack-point behavior.

## 2. Oracle seed initialization transaction

- [ ] 2.1 Add an idempotent installation migration that permits explicit canonical seed IDs and reserves generated-ID ranges above them; verify on a disposable schema that `demo_user` remains ID 1 and later implicit inserts cannot collide with seed IDs.
- [ ] 2.2 Implement deterministic Oracle temporal rebasing from one source anchor to an injected/captured UTC target anchor, preserving nulls, signed historical/future offsets, calendar months, end-of-month intent, data type, time-zone instant, and fractional precision; verify fixtures cover leap years, February, 30/31-day boundaries, DST crossings, and the fixed `2027-03-31T12:34:56.789Z` test anchor.
- [ ] 2.3 Implement the LuminaForge DML-only seed routine with child-to-parent deletes, parent-to-child inserts, stable IDs, pre-commit counts/referential/temporal validation, and no internal commit; verify same-anchor repeat runs are byte-for-byte equivalent and an injected mid-load failure leaves the pre-run dataset intact after caller rollback.
- [ ] 2.4 Extend `SYS.aegis_demo_control` with a fixed-target definer-rights initializer and advisory lock, without accepting dynamic identifiers; verify package tests reject a non-demo PDB/schema, serialize concurrent calls, preserve Firewall/policy/violation state, and return only anchor/count metadata.

## 3. Aegis server safety and Oracle Thin execution

- [ ] 3.1 Add explicit demo-only configuration and startup/request validation for the exact `LUMINAFORGE` target, disabled by default; verify disabled, ambiguous, production, and alternate-schema configurations fail before acquiring a reset connection.
- [ ] 3.2 Add short-lived server-verifiable break-glass grant issuance, expiry, same-origin validation, and clearing while preserving demo login semantics and never logging passwords; verify unauthenticated, expired, tampered, cross-origin, and cleared grants cannot invoke initialization.
- [ ] 3.3 Add the whitelisted `luminaforge / initialize-demo-seed-data` request mapping and execute it with native `oracledb` Thin Mode in strict `try...catch...finally`: commit only after validation, explicitly roll back in `catch`, and explicitly `connection.close()` in `finally`; verify success commits once and every simulated Oracle/package error rolls back, closes the connection, and returns sanitized feedback.
- [ ] 3.4 Add route/service tests for enum rejection, duplicate/concurrent requests, success metadata, lock contention, validation failure, and secret redaction; verify the focused Aegis test command passes with no raw SQL accepted from the browser.

## 4. Aegis presenter controls

- [ ] 4.1 Render **Initialize Demo Seed Data** immediately below **Break-Glass Control** without changing navigation state; verify component tests assert label, order, destructive styling, and unchanged active section.
- [ ] 4.2 Implement the login-to-confirmation flow with the exact phrase `RESET LUMINAFORGE DEMO DATA` and a modal that names all four affected tables; verify cancellation, mismatched text, and failed login issue no initialization request.
- [ ] 4.3 Implement in-flight disabling and structured success/failure output showing target anchor, table counts, and rollback status without secrets; verify double-click submits once and the control re-enables after both success and failure.
- [ ] 4.4 Add an Aegis browser test that logs in, confirms, observes success, and verifies a direct unauthenticated request is denied; verify the test also confirms the dashboard section does not change.

## 5. Cross-application verification and deployment safeguards

- [ ] 5.1 Run the reset against a disposable Oracle demo schema containing mutated, missing, extra, and FK-constrained rows; verify all four tables match the manifest, all temporal expectations use one anchor, and a second fixed-anchor run is identical.
- [ ] 5.2 Run LuminaForge's benign session, market, portfolio, recent-transaction, and all four attack-point checks after reset; verify expected IDs/data remain available and SQL Firewall configuration plus existing violation logs are unchanged.
- [ ] 5.3 Run Aegis and LuminaForge typecheck/lint/test/build commands plus strict OpenSpec validation; verify all commands pass and review the final diff to confirm it contains no secret, Thick Mode dependency, caller-selected schema, or unscoped destructive SQL.

## Workflow follow-up

- After human review and implementation, archive the completed change with the OpenSpec archive workflow and verify the canonical specs receive the deltas.
