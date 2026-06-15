## Why

Switching LuminaForge nav tabs triggers `GET /api/session` on every route change. With SQL Firewall **ENFORCE_ALL**, Oracle logs **Context violation** rows (empty `SQL_TEXT`) when the LuminaForge Node process connects with session attributes (client program, IP, OS user) that were not captured during allow-list training. Default policy bootstrap runs benign SQL from the **Aegis Vault** luminaforge pool, not from the LuminaForge app server — so normal tab navigation produces spurious SOC alerts that look like attacks but are benign session-context noise.

## What Changes

- Extend benign bootstrap SQL to include the navbar session lookup shape (`SELECT username, role FROM users WHERE id = :userId`).
- During **Initialize default demo policy**, after capture starts, invoke LuminaForge HTTP endpoints (`/api/session`, `/api/portfolio`) so allow-list training captures **session context from the LuminaForge server process** (not only Aegis).
- Add `LUMINAFORGE_BASE_URL` (default `http://localhost:3001`) for the training HTTP step; surface a clear error if LuminaForge is not reachable.
- Document **Context violation vs SQL violation** for presenters in `luminaforge/SPEC-luminaforge.md` (empty FULL SQL is expected for context rows).

## Capabilities

### New Capabilities

_(none — behavior fits existing firewall-policy and session-identity specs)_

### Modified Capabilities

- `luminaforge-default-firewall-policy`: Default policy init SHALL train allow-list from LuminaForge app HTTP traffic (session + portfolio) while capture is on, in addition to PL/SQL bootstrap.
- `luminaforge-session-identity`: After default policy init, tab navigation SHALL NOT produce Context violation rows under normal demo conditions (LuminaForge running during init).

## Impact

- `aegis-vault/lib/db/demo-control.ts` — `executeInitDefaultPolicy` HTTP training step
- `sql/luminaforge_bootstrap_benign.sql` — session lookup query
- `aegis-vault/lib/db/luminaforge-session.ts` — inline fallback SQL list
- `luminaforge/SPEC-luminaforge.md` — presenter note on context violations
- `aegis-vault/.env.example` — optional `LUMINAFORGE_BASE_URL`
- **Operational:** LuminaForge must be running when presenter clicks **Initialize default demo policy** (documented in Demo Control output)
