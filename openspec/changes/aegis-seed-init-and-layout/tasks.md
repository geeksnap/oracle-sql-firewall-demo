# Tasks

## 1. Grant cookies and failure copy

- [x] 1.1 Set grant cookie `Secure` from request scheme / `AEGIS_COOKIE_SECURE` (not `NODE_ENV`) and verify unit tests cover HTTP (no Secure) vs HTTPS (Secure)
- [x] 1.2 Honor `seedGrantIssued` in Break-Glass login → seed confirmation, and verify a `false` response does not open the confirmation
- [x] 1.3 Return `mutationAttempted: false` on auth/config rejection and omit rollback copy in the seed modal unless a mutation was attempted; verify the 401 message does not include “Rollback could not be confirmed”
- [x] 1.4 Sanitize login errors so missing grant-secret configuration does not leak env var names, and verify the 503/config path is covered by tests

## 2. Demo-host enablement (no secrets in git)

- [x] 2.1 Write `DEMO_SEED_RESET_ENABLED=true`, `DEMO_ENVIRONMENT=demo`, `DEMO_SEED_SCHEMA=LUMINAFORGE`, and a generated `BREAK_GLASS_GRANT_SECRET` from cloud-init; verify the template contains those keys and no hardcoded secret
- [x] 2.2 Add `scripts/ensure-demo-seed-env.sh` (upsert missing keys, replace placeholder secret, never print the secret) and invoke it from `start.sh --mode oci`; verify the script is idempotent on a fixture `.env`
- [x] 2.3 Document the keys in `aegis-vault/.env.example` and terraform env tables without real secrets; verify `.env.example` stays fail-closed for local copies

## 3. Sidebar treatments and 12:9 frame

- [ ] 3.1 Swap Break-Glass (filled) and Initialize Demo Seed Data (outline) classNames and verify Playwright still finds both controls with the swapped treatments
- [x] 3.2 Change the outer application frame from `aspect-square` to landscape `aspect-[12/9]` sized to the largest fitting 12:9 box, apply the same ratio wherever the square frame is defined, and verify no 1:1 or 16:9 shell class remains
- [x] 3.3 Update `aegis-vault/SPEC-aegis.md` layout + seed-grant notes and verify they match 12:9, filled/outline, and HTTP grant behavior

## 4. Integration checks

- [ ] 4.1 Run Aegis unit tests, Playwright presenter flow, typecheck, lint, and production build; verify they pass
- [ ] 4.2 Strict-validate this OpenSpec change and verify `openspec validate --strict --change aegis-seed-init-and-layout` passes
- [ ] 4.3 Exercise the UI in a browser (local and/or live): 12:9 frame, swapped buttons, break-glass → seed confirm; capture screenshots under the assigned media path. If live OCI cannot be patched without `~/.ssh/id_ed25519_sqlfw.key`, record that blocker instead of a successful live seed init

## Workflow follow-up

- Do not merge unless asked. Do not touch unrelated PR #10.
- Archive this change after review/merge.
