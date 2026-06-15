## Why

The LuminaForge header shows a hardcoded `demo_user` pill in the upper right. After Attack Point 4 (stacked `UPDATE users SET role='admin'`), the database role changes but the UI still says `premium`, which breaks the demo narrative. Presenters need the navbar to reflect the **live** `users.username` and `users.role` for the demo session account (`user_id = 1`).

## What Changes

- Add a **safe** read API that returns `username` and `role` for demo user `id = 1` using bind variables.
- Update `NavBar.tsx` to fetch and display live username + role (replace hardcoded `demo_user`).
- Style role badge (e.g. highlight `admin` after privilege escalation).
- Refetch session identity on route navigation and window focus so post–Attack Point 4 updates appear without a full page reload.
- Update `SPEC-luminaforge.md` and app-shell spec delta.

## Capabilities

### New Capabilities

- `luminaforge-session-identity`: Safe demo-session user lookup and navbar presentation of username/role from `users`.

### Modified Capabilities

- `luminaforge-app-shell`: Navbar SHALL show live session identity from the database, not a static label.

## Impact

- `luminaforge/src/lib/db/safe-queries.ts` — `fetchDemoSessionUser()`
- `luminaforge/src/app/api/session/route.ts` — new GET endpoint (safe)
- `luminaforge/src/components/NavBar.tsx` — dynamic username, role badge, avatar initial
- `luminaforge/SPEC-luminaforge.md`

No schema or reset-script changes.
