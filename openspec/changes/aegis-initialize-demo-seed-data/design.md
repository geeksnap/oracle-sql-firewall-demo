# Design

## Context

See `proposal.md` for motivation. Aegis Vault is the control surface and connects as `AEGIS_APP`; the mutable application dataset belongs to `LUMINAFORGE`. The current seed is duplicated across `Oracle_DB_Setup.sql`, `luminaforge/scripts/reset-demo-data.sql`, `sql/luminaforge_reinit_transactions.sql`, and helper scripts. Only `TRANSACTIONS.TIMESTAMP` is temporal today, and most rows are expressed as `SYSTIMESTAMP - INTERVAL`, so separate executions do not share one anchor.

The existing sidebar has one **Break-Glass Control** navigation button. The canonical spec requires break-glass login, but the current page selects the panel directly and `POST /api/demo-control/execute` does not enforce a server-side grant. The existing full reset script uses SQL*Plus directives and commits after several independent operations; the transaction-only definer procedure commits internally. Neither is an atomic full-dataset reset suitable for a web action.

Oracle access must remain native `oracledb` Thin Mode. No Instant Client or `initOracleClient()` dependency is allowed. Every reset connection path must use explicit `try...catch...finally`, roll back in `catch`, and explicitly `close()` in `finally`.

## Goals / Non-Goals

**Goals:**
- Make one repository source authoritative for the four LuminaForge seed tables and their stable IDs.
- Make the action all-or-nothing, serialized, idempotent, and safe against an accidental non-demo target.
- Define temporal rebasing precisely enough for deterministic unit and Oracle integration tests.
- Repair the authorization gap for this destructive action and provide unambiguous confirmation and feedback.
- Keep setup SQL, reset SQL, Aegis/LuminaForge specs, and the web action aligned.

**Non-Goals:**
- Reset SQL Firewall policies, captures, allow-lists, or violations.
- Reset Aegis polling state or synthetic break-glass events.
- Recreate the LuminaForge schema, alter production data, or accept caller-provided schema/table names.
- Replace the narrower **Reinitialize default transaction data** control; it remains useful for Attack Point 2 loops.
- Treat demo-mode arbitrary credentials as real identity authentication.

## Decisions

### 1. Scope the mutation to LuminaForge's four business tables

The reset owns `LUMINAFORGE.USERS`, `PORTFOLIO`, `TRANSACTIONS`, and `LUXURY_ITEMS`. Aegis has no seed-owned business tables in the current architecture; it initiates the operation but is not a second dataset target. Firewall and violation state is explicitly excluded.

The database procedure uses fixed, schema-qualified identifiers. The app checks an explicit demo-reset enable flag and exact `LUMINAFORGE` target before acquiring a connection; the definer procedure independently asserts the expected PDB/schema and known tables. The browser cannot submit a schema or SQL string.

Alternative considered: reset both database users because the apps are paired. Rejected because `AEGIS_APP` owns control/monitoring behavior, not a corresponding seeded business dataset, and deleting its operational state would silently broaden the destructive boundary.

### 2. Consolidate seed values into one canonical manifest

Implementation will create one canonical seed manifest consumed by fresh setup and reset generation. It includes stable IDs, all non-secret demo values, expected counts, relationship keys, and temporal source values. Existing setup/reset files become generated consumers or thin wrappers, eliminating current drift. Demo credentials remain synthetic seed fixtures; no environment password, wallet, or real credential is stored or logged.

The current application contract requires `demo_user` to remain ID 1. A one-time deployment migration changes seed-table identity columns to permit explicit canonical IDs and reserves generated-ID ranges above the seed bands. This migration occurs during controlled installation, not inside the reset transaction. The web action then uses DML only, so rollback remains real and stable IDs do not depend on sequence state.

Alternative considered: let identities continue increasing and resolve relationships by username. Rejected because LuminaForge and its attack demonstrations currently depend on stable numeric user IDs. Truncation/identity restart was also rejected because Oracle DDL commits implicitly and cannot provide action-level rollback.

### 3. Use a definer-rights transaction with no internal commit in child routines

Add a fixed-purpose `SYS.aegis_demo_control.initialize_demo_seed_data` wrapper and a LuminaForge-owned seed routine. The wrapper acquires a database advisory lock, validates the target, and calls the seed routine. The seed routine:

1. Captures one target anchor.
2. Deletes `TRANSACTIONS`, `PORTFOLIO`, then independent `LUXURY_ITEMS`, and finally `USERS`.
3. Inserts `USERS`, then `LUXURY_ITEMS`, `PORTFOLIO`, and `TRANSACTIONS`.
4. Validates canonical counts, IDs, foreign-key relationships, and temporal invariants.
5. Returns anchor/count metadata without committing.

The Aegis database service owns `commit`. In a strict `try` block it obtains a pooled Thin connection, invokes the package, validates output, and commits. Its `catch` explicitly rolls back and returns sanitized failure/rollback feedback. Its `finally` explicitly closes the connection. Child procedures must not commit or perform DDL.

The advisory lock rejects or times out a concurrent initializer so two app instances cannot interleave deletes/inserts. The UI busy state is only a convenience; database serialization is authoritative.

Alternative considered: execute the existing SQL file statement by statement from Node. Rejected because SQL*Plus parsing, scattered autocommits, and duplicated seed values weaken rollback and validation.

### 4. Rebase from a declared UTC source anchor

The manifest source anchor is `2026-06-01T00:00:00.000Z`, matching the June 2026 canonical demo generation period. Every source date is stored as a value relative to that anchor, even where today's SQL expresses only a day interval. Production action calls capture `SYSTIMESTAMP AT TIME ZONE 'UTC'` once inside Oracle. Tests may call a non-web, privileged test seam with an explicit target anchor; the public Aegis action never accepts a clock value.

Rebasing decomposes each source-to-value relationship into:
- signed whole calendar months,
- whether the source is the last day of its month, and
- a signed residual day/second/fraction interval.

The target applies calendar months first, preserving last-day classification, then applies the residual interval. This makes “one month before” remain one calendar month before instead of a fixed 30-day duration. Pure day/hour offsets remain exact durations. Negative offsets remain historical and positive offsets remain future. Null remains null.

All calculations run with an explicit UTC session. `TIMESTAMP WITH TIME ZONE` values are normalized by instant and retain their declared type/precision; naive Oracle `DATE` and `TIMESTAMP` values are interpreted in the UTC session and returned as the same type/precision. The current `TRANSACTIONS.TIMESTAMP` values are naive timestamps with day offsets, so their rebasing is exact-duration arithmetic. Manifest validation fails if a new temporal seed column is added without rebasing metadata.

Alternative considered: add `SYSTIMESTAMP` independently in every insert. Rejected because rows can receive different anchors, tests depend on wall-clock timing, and calendar-month/end-of-month intent cannot be represented.

### 5. Add server-verifiable break-glass gating and typed confirmation

Successful demo login issues a short-lived, signed, `HttpOnly`, `SameSite=Strict` break-glass grant; production deployment must provide the signing secret. The mutation route verifies signature, expiry, intended action, and same-origin request. Leaving Break-Glass Control calls a grant-clearing endpoint, and expiration always fails closed. Existing “any non-empty user” demo behavior remains, so this is an accidental-destruction control rather than proof of identity.

The new sidebar button opens login if the grant is absent, then a modal naming all four tables and requiring `RESET LUMINAFORGE DEMO DATA`. The server accepts only the whitelisted `luminaforge / initialize-demo-seed-data` enum and independently checks authorization plus demo-only configuration. Client confirmation is never treated as authorization.

Alternative considered: rely on `window.confirm` and React state. Rejected because direct requests bypass both and a generic prompt does not make table scope clear.

### 6. Return structured, sanitized operation results

The package returns the UTC target anchor and expected/actual counts for all tables. Aegis appends these to the existing presenter output style. Failures distinguish precondition rejection, lock contention, validation failure, and Oracle rollback without returning seed passwords, submitted break-glass passwords, DB credentials, bind contents, or stack traces.

Both `SPEC-aegis.md` and `SPEC-luminaforge.md` are updated in implementation: Aegis documents the guarded button/control flow; LuminaForge documents the four-table restoration and date semantics.

## Risks / Trade-offs

- **[Identity migration could conflict with existing deployments]** → Detect current identity definitions and maximum IDs, reserve non-overlapping generated ranges in an idempotent installation migration, and verify `demo_user = 1` before enabling the action.
- **[A future table or FK expands the required ordering]** → Keep an explicit table allow-list and pre-commit relationship validation; fail closed when manifest/schema expectations diverge.
- **[Oracle calendar arithmetic has surprising end-of-month behavior]** → Encode last-day intent separately and test leap years, February, 30/31-day boundaries, and positive/negative month offsets.
- **[A reset can block live LuminaForge reads briefly]** → Keep the DML transaction bounded, use one advisory lock, and report lock contention instead of queuing duplicate presenter requests indefinitely.
- **[Signed demo grants are not real authentication]** → Label the mechanism as demo-only, keep expiry short, require same-origin and explicit enablement, and fail closed outside configured demo mode.
- **[Canonical seed generation adds build discipline]** → Add drift tests that compare generated setup/reset artifacts with the manifest so changes cannot land partially.

## Migration Plan

1. Add the canonical manifest, generators, deterministic rebasing tests, and both application spec updates.
2. Add an idempotent Oracle installation migration for explicit seed IDs/reserved generated ranges and install the revised definer package with no child commit.
3. Deploy the database package first and verify version, target assertions, rollback injection, row counts, stable IDs, and temporal fixtures against a disposable demo schema.
4. Deploy Aegis authorization, confirmation, API mapping, and sidebar UI with demo reset disabled by default.
5. Explicitly enable the action only in the known demo environment, run one reset, and smoke-test all four LuminaForge attack points and benign views.

Rollback disables the app feature flag first, then reverts Aegis UI/API. The previous package can be reinstalled after no reset is active. The identity migration may remain because reserved ranges are backward-compatible; reverting it is not required for feature rollback.
