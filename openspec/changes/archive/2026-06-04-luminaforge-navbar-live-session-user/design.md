## Context

`NavBar.tsx` renders a static cyan pill `demo_user` and avatar initial `D`. The LuminaForge app models a single logged-in wealth client as `users.id = 1` (`demo_user`, seeded `role = premium`). Attack Point 4 can elevate that row to `admin` while the UI still shows the old label.

Other routes already treat `user_id = 1` as the session user (`fetchPortfolio(1)`, transaction recent API, etc.).

## Goals / Non-Goals

**Goals:**

- Display **username** and **role** from `users` for `id = 1` in the upper-right header.
- Use parameterized SQL only (contrast with vulnerable routes).
- Refresh after navigation/focus so presenters see `admin` after bulk attack without editing code.

**Non-Goals:**

- Real authentication, JWT, or multi-user login.
- Aegis Vault header changes (LuminaForge only unless later requested).
- Loading password or other sensitive columns in the API.

## Decisions

### 1. API shape

**Chosen:** `GET /api/session` → `{ username, role }` (optional `error`).

**Query:**

```sql
SELECT username, role FROM users WHERE id = :userId
```

with `userId = 1` bound.

**Alternatives:** Embed in layout server component — rejected to keep `NavBar` client-side with existing search bar and match portfolio fetch pattern.

### 2. Refresh strategy

**Chosen:** Fetch on mount, when `pathname` changes, and on `window` `focus` (presenter returns from bulk page or switches tabs).

**Alternatives:** Polling every N seconds — unnecessary noise; manual refresh only — weak demo UX.

### 3. Navbar presentation

**Chosen:**

- Primary pill: `username` (e.g. `demo_user`)
- Secondary pill or suffix: `role` in uppercase (e.g. `PREMIUM`, `ADMIN`)
- Avatar initial: first character of username
- Role `admin` uses gold/red accent to signal escalation after Attack Point 4

### 4. Fallback

If API fails, show `demo_user` / `—` so the shell does not break offline rehearsals.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Firewall blocks simple SELECT on `users` | Ensure allow-list includes session lookup; benign traffic |
| Brief loading flash | Show last known or fallback until fetch completes |

## Migration Plan

Deploy API + NavBar change only. No DB migration.

## Open Questions

None.
