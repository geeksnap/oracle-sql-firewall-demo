## Why

The Break-Glass Control panel currently requires login only **once per browser session** — after the first authentication, the panel stays unlocked indefinitely. This defeats the purpose of the control: every access to sensitive firewall presenter controls should be individually authenticated and individually logged as a violation event for audit traceability.

## What Changes

- Remove the `breakGlassUnlocked` session-state flag that persists across sidebar clicks.
- Every click of the "Break-Glass Control" sidebar item opens the login modal, regardless of prior logins in the same session.
- Every successful Break-Glass login writes a violation row to the Live Violations feed (already partially implemented; ensure it fires on every login, not just the first).
- The "Break-Glass Control" panel is only visible while the modal's `onSuccess` callback is active — navigating away and returning requires re-authentication.

## Capabilities

### New Capabilities

- `aegis-break-glass-always-auth`: Per-click Break-Glass authentication — modal is shown on every sidebar click; panel access is gated per-navigation, not per-session.

### Modified Capabilities

- `aegis-break-glass-control`: Authentication persistence behaviour changes from session-level to per-click. Violation logging must fire on every login event, not only on the first.

## Impact

- `aegis-vault/src/app/page.tsx` — remove `breakGlassUnlocked` persistent state; restructure nav handler so the panel is never "permanently unlocked".
- `aegis-vault/src/components/BreakGlassModal.tsx` — no UI change required; modal already works per invocation.
- `aegis-vault/lib/break-glass-store.ts` (or equivalent API route) — ensure the violation record is emitted on every login call, not deduplicated by session.
- `aegis-vault/src/app/api/break-glass/login/route.ts` — verify no early-return that skips logging on repeat logins.
