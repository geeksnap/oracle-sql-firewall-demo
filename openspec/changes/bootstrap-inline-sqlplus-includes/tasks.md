# Tasks

- [x] 1. Add `expandSqlplusIncludes` to `scripts/oci-bootstrap-database.mjs`; call it for every bootstrap script; throw on missing/circular/unresolved `@@`; remove the Demo Control–only two-file inline
- [x] 2. Guard `main()` on direct invocation; export expand/split for tests
- [x] 3. Add `tests/oci-bootstrap-includes.test.mjs`: Setup expands seed package before initialize; Demo Control expands all four includes; missing include throws
- [x] 4. Add terraform README troubleshooting for `PLS-00201` / skipped `@@` (load package then re-run bootstrap; do not Destroy DB)
- [x] 5. Run `node --test tests/*.mjs` and confirm no secrets in the diff
