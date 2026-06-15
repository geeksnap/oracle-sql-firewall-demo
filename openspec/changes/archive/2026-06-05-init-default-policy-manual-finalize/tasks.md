## 1. Backend — stop auto-finalize

- [x] 1.1 Remove `finalize_default_demo_policy` call from `executeInitDefaultPolicy` in `demo-control.ts`
- [x] 1.2 Update `displaySql` / `sqlForAction` init-default-policy comments (steps 1–4 only; manual finalize)
- [x] 1.3 Extend `DemoExecuteResult` with optional `initManualFinalize` payload (steps completed + next steps)

## 2. UI — confirm dialog and success modal

- [x] 2.1 Update `confirmMessage` for `init-default-policy` (guided capture; manual Stop + Generate)
- [x] 2.2 Add modal component (or inline in `DemoControlPanel`) shown on init success with steps 1–4 summary and steps 5–7 instructions
- [x] 2.3 Wire `runAction` to open modal when `data.initManualFinalize` or `action === init-default-policy` && ok

## 3. Documentation and verification

- [x] 3.1 Update `#Document/Demo_Control_Setup.md` and `luminaforge/SPEC-luminaforge.md` init workflow
- [ ] 3.2 Manual: init → modal → browse LuminaForge → Stop SQL capture → Generate Allow List → ENFORCED · LOG
- [x] 3.3 `npm run build` in `aegis-vault` passes
