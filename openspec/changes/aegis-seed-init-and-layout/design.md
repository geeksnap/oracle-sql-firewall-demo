# Design

## Context

See `proposal.md` for motivation. Live `GET /api/build` is BUILD 81 / DB PKG 2.11.0. Live `POST /api/break-glass/login` returns `seedGrantIssued: false` and no `Set-Cookie`; `POST /api/demo-control/execute` then returns 401 `Break-glass authorization is required`. The confirmation modal always appends “Rollback could not be confirmed” when `rolledBack` is falsy, which matches the presenter screenshot.

OCI cloud-init writes Aegis `.env` with DB keys only. `DEMO_SEED_RESET_ENABLED` is therefore unset, so login never calls `issueBreakGlassGrant`. Independently, grant cookies use `secure: NODE_ENV === "production"`; systemd sets `NODE_ENV=production` while the demo origin is `http://161.33.154.45:3000`, so a Secure cookie would be dropped even after enabling the flag.

The outer shell is `aspect-square` sized to `min(100%, 100dvh - padding)` from archived `aegis-square-viewport-1-1`. Oracle access stays native `oracledb` Thin Mode. No secrets in git. Do not recreate the PDB. Do not touch PR #10.

## Goals / Non-Goals

**Goals:**
- Presenter can complete break-glass login, type `RESET LUMINAFORGE DEMO DATA`, and run seed init when demo reset is enabled on an HTTP host.
- Failure copy is accurate: rollback language only after a mutation attempt.
- Sidebar filled/outline treatments swapped; outer frame 12:9 (4:3).
- New deploys and `start.sh --mode oci` enable demo reset with a generated grant secret.

**Non-Goals:**
- Recreating or reseeding the PDB as part of this change.
- Changing SQL Firewall package behavior beyond grants already on 2.11.0.
- Merging this PR or applying it to live OCI from this agent without the laptop SSH key.
- Archiving `aegis-initialize-demo-seed-data` (owned by PR #10).

## Decisions

### 1. Cookie Secure follows request scheme, not NODE_ENV

`setBreakGlassGrantCookie` / `clearBreakGlassGrantCookie` take the incoming request and set `secure` from `x-forwarded-proto` / request URL, with `AEGIS_COOKIE_SECURE=true|false` as an explicit override. Default for this HTTP demo is non-Secure.

Alternative considered: always `secure: false`. Rejected because a future HTTPS front door should keep Secure cookies. Alternative: keep NODE_ENV production Secure. Rejected because it is the live failure mode.

### 2. Keep fail-closed; enable flags only in deploy-time .env

Do not default `DEMO_SEED_RESET_ENABLED` to true in application code. Cloud-init and `scripts/ensure-demo-seed-env.sh` (invoked from `start.sh --mode oci`) upsert:

- `DEMO_SEED_RESET_ENABLED=true`
- `DEMO_ENVIRONMENT=demo`
- `DEMO_SEED_SCHEMA=LUMINAFORGE`
- `BREAK_GLASS_GRANT_SECRET` generated with `openssl rand` when missing or still the example placeholder

The script never prints the secret. `.env.example` stays fail-closed (`false`) plus a placeholder secret.

Alternative considered: in-process generated secret when the flag is missing. Rejected because it would silently enable destructive reset against the fail-closed spec.

### 3. Client honors `seedGrantIssued`; modal omits rollback unless mutationAttempted

Break-glass login JSON already includes `seedGrantIssued`. The page must not set seed-grant UI state or open the confirmation when that flag is false. Authorization responses include `mutationAttempted: false` and omit rollback copy. Database-path failures keep `rolledBack` and `mutationAttempted: true`.

### 4. Landscape 12:9 frame via CSS aspect-ratio

Replace `aspect-square w-[min(100%,calc(100dvh-padding))]` with `aspect-[12/9] w-[min(100%,calc((100dvh-padding)*12/9))]`. That is the largest 12:9 box that fits. Globe stays compact (~360px); it is not the application frame and MUST NOT become 16:9.

### 5. Swap button classNames only

Move today’s Initialize filled classes onto Break-Glass (inactive) and today’s Break-Glass outline classes onto Initialize. Active Break-Glass selected state stays the stronger filled selected treatment.

## Risks / Trade-offs

- **[Risk] Existing live VM `.env` is not rewritten by cloud-init** → Mitigation: `ensure-demo-seed-env.sh` on `start.sh --mode oci`. This agent cannot SSH (`~/.ssh/id_ed25519_sqlfw.key` is on the laptop); live remains on BUILD 81 until an operator deploys this branch.
- **[Risk] Enabling demo reset is destructive** → Mitigation: still requires break-glass grant + exact confirmation phrase; flag is explicit in `.env`.
- **[Risk] 12:9 on short viewports clips inner panels** → Mitigation: keep internal scroll; size to largest fitting 12:9; verify at 1920×1080 and 1440×900.

## Migration Plan

1. Merge is not performed by this change.
2. After code lands: git pull on compute, run `ensure-demo-seed-env.sh` or `./start.sh --mode oci`, rebuild/restart Aegis. Grant-only DB changes if a later package bump is required (none expected; live already 2.11.0).
3. Rollback: revert the app deploy; `.env` keys can remain (fail-closed if `DEMO_SEED_RESET_ENABLED` is set back to `false`).
