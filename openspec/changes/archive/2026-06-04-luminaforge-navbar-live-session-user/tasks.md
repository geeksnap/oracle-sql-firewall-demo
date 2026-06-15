## 1. Backend (safe)

- [x] 1.1 Add `fetchDemoSessionUser()` in `safe-queries.ts` — `SELECT username, role FROM users WHERE id = :userId` (default `userId = 1`)
- [x] 1.2 Add `GET /api/session` returning `{ username, role }`

## 2. NavBar UI

- [x] 2.1 Fetch session on mount, pathname change, and window focus
- [x] 2.2 Replace hardcoded `demo_user` with live `username` and `role` badges
- [x] 2.3 Avatar initial from username; emphasize `admin` role styling after escalation

## 3. Documentation

- [x] 3.1 Update `luminaforge/SPEC-luminaforge.md` — navbar live session identity

## 4. Verification

- [x] 4.1 `npm run build` in `luminaforge` passes
- [x] 4.2 Manual: navbar shows `demo_user` / `premium` on load
- [x] 4.3 Manual: after Attack Point 4 success + refocus/navigate, navbar shows `admin` role
