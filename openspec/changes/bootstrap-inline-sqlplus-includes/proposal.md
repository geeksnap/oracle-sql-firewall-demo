# Proposal

## Why

Live install on compute `161.118.237.193` (`main` @ `fae2452`) connected SYS in Thin Mode, then failed with `PLS-00201: identifier 'LUMINAFORGE.AEGIS_DEMO_SEED' must be declared`. The seed package file is present on the clone. `scripts/oci-bootstrap-database.mjs` drops every SQL*Plus `@@` line in `splitSqlBlocks`, inlines only two includes inside `Oracle_DB_Demo_Control_Grant.sql`, then still executes `luminaforge.aegis_demo_seed.initialize(...)` from `Oracle_DB_Setup.sql`. That is a deploy-blocking bug on `origin/main`, not a missing-file or stale-clone issue.

## What Changes

- Expand every `@@relative/path.sql` include in bootstrap SQL (relative to the calling script) before splitting/executing statements.
- Fail loudly if an include file is missing or an `@@` line remains unresolved. Do not skip includes.
- Remove the Demo Control–only two-file inline special case; `Oracle_DB_Setup.sql` and `Oracle_DB_Demo_Control_Grant.sql` both load `sql/luminaforge_demo_seed.sql` (and the other Demo Control includes) before any `aegis_demo_seed` call.
- Add a unit test that expanded `Oracle_DB_Setup.sql` contains `CREATE OR REPLACE PACKAGE luminaforge.aegis_demo_seed` before `initialize`.
- Document the `PLS-00201` failure and the live repair (load the package, then re-run bootstrap). Do not Destroy the DB.

## Capabilities

### New Capabilities

*(None.)*

### Modified Capabilities

- `compute-ubuntu-thin`: Thin Mode bootstrap MUST expand SQL*Plus `@@` includes and create `LUMINAFORGE.AEGIS_DEMO_SEED` before calling `initialize`.

## Impact

- `scripts/oci-bootstrap-database.mjs`
- `tests/oci-bootstrap-includes.test.mjs` (new)
- `openspec/specs/compute-ubuntu-thin/spec.md` (delta in this change)
- `terraform/README.md` troubleshooting row for `PLS-00201` / skipped `@@`
- No app UI, no Thick Mode, no DB destroy/recreate
