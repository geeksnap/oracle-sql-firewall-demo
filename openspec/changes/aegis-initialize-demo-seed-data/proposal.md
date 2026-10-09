# Proposal

## Why

Repeated attack demonstrations mutate LuminaForge business data and leave seeded timestamps aging out of date-sensitive views, while the current Break-Glass tools reset only selected transaction rows. Presenters need one explicit, guarded action that restores the complete demo baseline and makes its temporal story current without rebuilding the schema.

## What Changes

- Add an Aegis Vault sidebar button directly below **Break-Glass Control** labeled **Initialize Demo Seed Data**.
- Require a current break-glass authorization and a destructive confirmation that names the LuminaForge demo schema and affected tables before the action can run.
- Add a server-side, whitelisted initialization action that atomically replaces the seed-owned rows in `LUMINAFORGE.USERS`, `LUMINAFORGE.PORTFOLIO`, `LUMINAFORGE.TRANSACTIONS`, and `LUMINAFORGE.LUXURY_ITEMS`, deleting in foreign-key-safe child-to-parent order and inserting in parent-to-child order.
- Rebase every non-null seeded `DATE`/`TIMESTAMP` value from an explicit source-dataset anchor to one database-captured current anchor while preserving whether it is historical or future and preserving its calendar/time offset semantics.
- Return a clear success summary (anchor and row counts) or failure feedback; roll back the entire reset on any error and make repeated successful runs converge on the same baseline relative to each run's anchor.
- Keep Aegis operational data, SQL Firewall policies/captures/allow-lists, violation logs, and in-memory break-glass events out of scope. The control lives in Aegis, but the mutable business dataset currently belongs only to LuminaForge.
- Update both application specifications to document Aegis as the guarded control surface and LuminaForge as the dataset being restored.

## Capabilities

### New Capabilities
- `demo-seed-initialization`: Guarded, transactional restoration of the complete LuminaForge demo dataset with deterministic temporal rebasing and observable outcomes.
- `aegis-demo-seed-control`: Aegis sidebar placement, break-glass authorization, typed confirmation, and presenter feedback for invoking demo seed initialization.

### Modified Capabilities
- None.

## Impact

- Aegis Vault sidebar, break-glass authorization state, demo-control request types/API handling, output and failure feedback.
- Oracle Thin Mode database execution and the `SYS.aegis_demo_control` definer-rights package/grants.
- Canonical seed/reset SQL for the LuminaForge `users`, `portfolio`, `transactions`, and `luxury_items` tables, including identity/FK handling and date/timestamp metadata.
- Automated tests for authorization, confirmation, transaction rollback, repeatability, table ordering, row counts, and date/time rebasing.
- `aegis-vault/SPEC-aegis.md` and `luminaforge/SPEC-luminaforge.md` will be updated during implementation so the application specs remain authoritative.
