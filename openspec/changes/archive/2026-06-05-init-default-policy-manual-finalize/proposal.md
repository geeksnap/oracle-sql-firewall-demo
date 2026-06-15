## Why

**Initialize default demo policy** currently auto-runs `finalize_default_demo_policy` (stop capture → `GENERATE_ALLOW_LIST` → enable allow-list). Presenters lose the teaching moment: customers never see capture still running, browse LuminaForge to record real traffic, or manually press **Stop SQL capture** and **Generate Allow List**. The one-click finalize also hides what steps 1–4 actually did.

## What Changes

- **Backend:** `init-default-policy` stops after steps 1–4 (clear, start capture, benign bootstrap SQL, LuminaForge HTTP training). **Remove** the automatic `finalize_default_demo_policy` call.
- **UI:** After a successful init, show a **modal** (not only console text) summarizing steps 1–4 and instructing the presenter to:
  1. Run LuminaForge (and optionally Aegis) normally while capture is **ON**
  2. Click **Stop SQL capture**
  3. Click **Generate Allow List**
- **Confirm dialog:** Update pre-action confirm copy — init **starts** guided capture training; it no longer claims “no manual capture” or immediate ENFORCED · LOG.
- **Output console:** Still log technical success lines for steps 1–4; modal carries presenter-facing instructions.
- **Docs:** Update `#Document/Demo_Control_Setup.md` and `luminaforge/SPEC-luminaforge.md` workflow.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `luminaforge-default-firewall-policy`: Init action prepares capture + baseline seed only; allow-list enablement is manual via existing buttons.
- `demo-control-soc-aegis-vault`: Post-init instructional modal for Demo Control presenter workflow.

## Impact

- `aegis-vault/lib/db/demo-control.ts` — `executeInitDefaultPolicy` (drop finalize block)
- `aegis-vault/src/components/DemoControlPanel.tsx` — confirm message, modal on success
- New or existing modal component for init next-steps
- `aegis-vault/src/app/api/demo-control/execute/route.ts` — optional response field for modal payload
- `#Document/Demo_Control_Setup.md`, `luminaforge/SPEC-luminaforge.md`
