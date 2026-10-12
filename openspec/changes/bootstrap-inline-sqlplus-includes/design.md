# Design

## Context

`Oracle_DB_Setup.sql` is SQL*Plus-oriented:

```sql
@@sql/luminaforge_demo_seed.sql

DECLARE
  ...
BEGIN
  luminaforge.aegis_demo_seed.initialize(...);
END;
/
```

`node-oracledb` Thin Mode has no SQL*Plus. The bootstrap runner already inlines two `@@` files for `Oracle_DB_Demo_Control_Grant.sql` (`luminaforge_bootstrap_benign.sql`, `luminaforge_reinit_transactions.sql`) and then `splitSqlBlocks` silently continues past remaining `@@` lines. `Oracle_DB_Setup.sql` is never inlined, so the package is never created and `initialize` fails with `PLS-00201`. The same skip would drop `@@sql/luminaforge_demo_seed.sql` and `@@sql/luminaforge_demo_seed_identity_migration.sql` later in Demo Control.

The seed file exists at `sql/luminaforge_demo_seed.sql` on `origin/main` and on the live clone (`fae2452`).

## Approach

1. Add `expandSqlplusIncludes(sql, scriptDir)` that replaces each `@@path` line with the file body, resolving paths relative to the calling script (SQL*Plus `@@` semantics), recursively, and throwing if the file is missing or a cycle is detected.
2. Call it for every bootstrap script after `readFileSync` and before `prepareSql`, so PDB/password substitutions apply to included files too.
3. Delete the Demo Control–only `sql.replace("@@sql/...")` block.
4. Change `splitSqlBlocks` to throw on leftover `@@` instead of skipping.
5. Export expand/split for `node --test` coverage. Guard `main()` so importing the module does not connect to Oracle.

## Live repair (current `main`, no merge)

Users and schema already exist from the failed run. Load the package from the clone, then re-run bootstrap (idempotent skips for existing users/tables). Do not Destroy the DB. After merge, `git pull` + bootstrap is enough.

## Out of scope

- `scripts/run_reset_demo_data_vm.js` still skips `@@` (VM reset helper, not cloud-init).
- No change to generated `sql/luminaforge_demo_seed.sql` or the SQL*Plus `@@` lines in setup/grant scripts.
