## 1. Types and server-side synthetic violations

- [x] 1.1 Extend `FirewallViolation.source_app` in `lib/types.ts` to include `"Aegis Vault"`
- [x] 1.2 Add `lib/break-glass.ts` with `createBreakGlassViolation(username)`
- [x] 1.3 Add `lib/break-glass-store.ts` in-memory ring buffer (push/list, cap ~50)
- [x] 1.4 Merge break-glass rows into `lib/poller.ts` `runPollCycle` before emitting snapshots
- [x] 1.5 Add `emitBreakGlassViolation(io, v)` in `lib/poller-registry.ts`

## 2. API

- [x] 2.1 Implement `POST /api/break-glass/login` — validate non-empty username, push store, emit socket, return `{ violation }`

## 3. Navigation rename

- [x] 3.1 Rename `NavSection` `demo-control` → `break-glass-control` in `sidebar-types.ts`
- [x] 3.2 Update `Sidebar.tsx` label to **Break-Glass Control** and wire `break-glass-control` id
- [x] 3.3 Update `page.tsx` section switch and `DemoControlPanel` mount for `break-glass-control`

## 4. Break-glass modal UI

- [x] 4.1 Create `BreakGlassModal.tsx` — centered overlay, Break-Glass User + Password, Submit/Cancel
- [x] 4.2 Wire modal open on first `break-glass-control` select; `breakGlassUnlocked` session flag skips modal on repeat
- [x] 4.3 On submit call `/api/break-glass/login` and handle errors

## 5. Violations table presentation

- [x] 5.1 Style Source App `Aegis Vault` distinctly in `ViolationsTable.tsx`
- [x] 5.2 Compact variant: show `action_label` in Type column when `source_app === "Aegis Vault"`
- [x] 5.3 Add `actionCellClass` styling for `Break-Glass Logged in` on full variant (e.g. amber/warn tone)

## 6. Spec and docs

- [x] 6.1 Update `aegis-vault/SPEC-aegis.md` sidebar line: Demo Control → Break-Glass Control
- [x] 6.2 Rename `DemoControlPanel` visible title to **Break-Glass Control** (subtitle may note presenter operations)

## 7. Verification

- [ ] 7.1 Manual: click Break-Glass Control → modal → login → row in Live Violations with correct columns
- [ ] 7.2 Manual: wait for status poll → break-glass row still present
- [ ] 7.3 Manual: presenter panel (firewall buttons) still works after login
