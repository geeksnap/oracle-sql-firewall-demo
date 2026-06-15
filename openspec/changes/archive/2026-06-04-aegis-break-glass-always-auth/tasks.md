## 1. Client State Refactor (page.tsx)

- [x] 1.1 Rename `breakGlassUnlocked` → `breakGlassGranted` in `page.tsx` state and all references
- [x] 1.2 Update `handleNavSelect`: always open the modal when `next === "break-glass-control"` (remove the `!breakGlassGranted` guard)
- [x] 1.3 In `handleNavSelect`: set `breakGlassGranted = false` whenever `next !== "break-glass-control"` (clear grant on section change)
- [x] 1.4 In `BreakGlassModal` `onSuccess` callback: set `breakGlassGranted = true` and close modal (keep existing close-modal logic)
- [x] 1.5 Verify the panel section conditional still uses `breakGlassGranted` (not the old flag name)

## 2. Violation Logging Verification

- [x] 2.1 Confirm `/api/break-glass/login` route does NOT skip logging on repeat calls — review route.ts (no early return, no session check)
- [x] 2.2 Confirm `pushBreakGlassViolation` and `emitBreakGlassViolation` are called on every request (already correct — document confirmation)

## 3. Spec Update

- [x] 3.1 Update `aegis-vault/SPEC-aegis.md` Break-Glass section: change "requires login once per session" → "requires login on every sidebar click"

## 4. Manual Verification

- [ ] 4.1 Manual: click "Break-Glass Control" → modal shown → login → panel visible
- [ ] 4.2 Manual: navigate to Dashboard → click "Break-Glass Control" again → modal shown again (not skipped)
- [ ] 4.3 Manual: login twice → two "Break-Glass Logged in" rows appear in Live Violations with different timestamps
- [ ] 4.4 Manual: confirm panel is hidden after navigating to another section and requires re-login to access again
