## Context

The Break-Glass Control sidebar item guards the presenter firewall panel. The current implementation uses a `breakGlassUnlocked: boolean` state variable in `page.tsx` that is set to `true` on first login and never reset. Clicking the sidebar item again checks `!breakGlassUnlocked` before opening the modal, so no further authentication is ever required in the same browser session.

The server-side login route (`/api/break-glass/login`) correctly creates a violation record on every call — there is no server-side deduplication to fix.

## Goals / Non-Goals

**Goals:**
- Modal is opened on every click of the "Break-Glass Control" sidebar item, unconditionally.
- Successful login grants access to the panel for as long as the user stays on that section.
- Navigating away and returning requires re-authentication.
- Every login call reaches the API and produces a violation in the Live Violations feed.

**Non-Goals:**
- Rate-limiting or cooldown between logins (demo context: any credential works).
- Persisting login state across page reloads (already not persisted).
- Changes to `BreakGlassModal.tsx`, the API route, or the break-glass store.

## Decisions

### Decision 1: Replace persistent `breakGlassUnlocked` with per-navigation grant

**Chosen:** Replace `breakGlassUnlocked` (set once, never reset) with `breakGlassGranted` (set on login success, cleared on navigation away from `break-glass-control`).

`handleNavSelect` always opens the modal when `next === "break-glass-control"`, regardless of current grant state. `breakGlassGranted` is set to `true` inside `onSuccess` and set to `false` inside `handleNavSelect` whenever `next !== "break-glass-control"` — ensuring that navigating to any other section clears the grant before the next sidebar click.

**Alternative considered:** Reset only when modal closes without success (Cancel). Rejected — allows the user to re-enter the panel by clicking the sidebar while already on it without re-authenticating.

**Alternative considered:** Time-based grant expiry (e.g., 5 minutes). Rejected — adds complexity; per-navigation reset is simpler, more auditable, and fits the demo script.

### Decision 2: Do not de-duplicate violation log entries

Every `onSuccess` fires one POST to `/api/break-glass/login` which emits one violation. No client-side dedup is applied. The server already handles this correctly.

## Risks / Trade-offs

- **Risk: User sees modal "flicker" if they click Break-Glass Control while already on the panel.** → Acceptable — it is intentional re-authentication; the modal is identical each time.
- **Risk: Multiple rapid clicks open multiple modals.** → Mitigated by the existing `open` guard in `BreakGlassModal` (only one instance rendered). The `handleNavSelect` handler is synchronous, so double-clicks produce one modal open.
