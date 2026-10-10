# Proposal

## Why

Presenters cannot initialize LuminaForge demo seed data on the live HTTP Aegis Vault host: break-glass login succeeds without issuing a server-verifiable grant (`seedGrantIssued: false`), the confirmation flow still proceeds, and the failure modal concatenates “Break-glass authorization is required” with “Rollback could not be confirmed.” The application frame is also still a 1:1 square, and the two destructive sidebar buttons use the opposite filled/outline treatments from the requested presenter chrome.

## What Changes

- Make the documented break-glass → typed confirmation → seed initialization flow work on HTTP demo hosts: issue a usable grant cookie when demo reset is enabled, treat `seedGrantIssued` as authoritative in the client, and never describe rollback for pre-mutation authorization or configuration failures.
- Wire demo-reset enablement and a generated grant secret into OCI/cloud-init `.env` creation (secret never committed). Keep fail-closed unless those values are explicit.
- Swap sidebar treatments: **Break-Glass Control** uses the current filled destructive style; **Initialize Demo Seed Data** uses the current outline destructive style.
- Change the Aegis Vault application frame from 1:1 square to landscape **12:9** (4:3). Size it to the largest 12:9 rectangle that fits the viewport. Do not use 16:9.

## Capabilities

### New Capabilities

- `aegis-demo-seed-grant`: HTTP-safe, server-verifiable break-glass grants for demo seed initialization; presenter-visible grant issuance; failure copy that distinguishes authorization/config rejection from transactional rollback.

### Modified Capabilities

- `aegis-fixed-viewport-shell`: Replace the 1:1 square application frame with a centered landscape 12:9 (4:3) frame that still does not grow with violation rows.
- `aegis-command-nav`: Destructive sidebar chrome — filled **Break-Glass Control**, outline **Initialize Demo Seed Data** — without adding a third navigable section.

## Impact

- Aegis Vault: grant cookie flags, break-glass login response handling, seed confirmation failure copy, sidebar button classes, `page.tsx` (and any CSS/globe wrapper tied to the outer frame).
- OCI bootstrap: `terraform/compute/cloud-init.yaml.tftpl` writes `DEMO_SEED_RESET_ENABLED`, `DEMO_ENVIRONMENT`, `DEMO_SEED_SCHEMA`, and a generated `BREAK_GLASS_GRANT_SECRET`; `start.sh` can ensure the same keys on existing VMs without printing secrets.
- Canonical `aegis-vault/SPEC-aegis.md` layout and seed-control notes.
- Tests for HTTP vs HTTPS cookie `Secure`, grant issuance, and failure copy; Playwright presenter flow.
- Live OCI `.env` patch still requires SSH (`~/.ssh/id_ed25519_sqlfw.key` on the laptop). This change does not recreate the PDB and does not merge itself.
