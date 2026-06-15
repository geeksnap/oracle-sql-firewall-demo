## Context

Current `executeInitDefaultPolicy` (Aegis Vault):

1. `clear_firewall_policy('luminaforge')`
2. `init_default_demo_policy` → start capture
3. `runLuminaforgeBenignBootstrap` (PL/SQL / inline benign SQL)
4. `runLuminaforgeAppContextTraining` (HTTP `/api/session`, `/api/portfolio`)
5. `finalize_default_demo_policy` → stop capture, `GENERATE_ALLOW_LIST`, `ENABLE_ALLOW_LIST`, drop capture

Steps 1–4 seed capture logs with baseline benign SQL + LuminaForge app session context. Step 5 completes training without presenter involvement.

Demo Control §3.3 already exposes **Stop SQL capture** (`capture-off`) and **Generate Allow List** (`generate-allow-list`). `generate_allow_list` PL/SQL stops capture internally if still running; presenters may still click **Stop SQL capture** first for clarity (user request).

## Goals / Non-Goals

**Goals:**

- Init leaves SQL capture **running** after success.
- Presenter sees a clear modal explaining automated steps 1–4 and manual steps 5–7.
- Manual completion uses existing buttons — no new PL/SQL actions.

**Non-Goals:**

- Changing `generate-allow-list` or `capture-off` behavior.
- Auto-opening LuminaForge in a new tab.
- Removing benign bootstrap or HTTP training (still valuable seed data).

## Decisions

### 1. Remove finalize from API path only

**Chosen:** Delete the `finalize_default_demo_policy` call from `executeInitDefaultPolicy`. Keep the PL/SQL procedure in Oracle for DBA/scripts; Demo Control simply stops calling it from init.

**Alternative:** New action `init-default-policy-partial` — rejected; same button, clearer UX with updated label/copy.

### 2. Modal after success (client-side)

**Chosen:** On `init-default-policy` success, `DemoControlPanel` opens a styled modal (glass-panel, matches SOC theme) with:

- **What we did (Steps 1–4):** bullet list (cleared policy, capture ON, baseline SQL, LuminaForge HTTP context)
- **Your next steps (Steps 5–7):**
  - Use LuminaForge normally (click tabs, benign flows)
  - **Stop SQL capture**
  - **Generate Allow List** (SQL Monitor ON, Block OFF)

Dismiss with **Got it** — no second confirm.

**Alternative:** `window.alert` — rejected; too crude for demo presentation.

### 3. API response shape

**Chosen:** Extend successful `DemoExecuteResult` optionally:

```ts
initManualFinalize?: {
  captureActive: true;
  stepsCompleted: string[];
  nextSteps: string[];
}
```

Client reads this to populate modal; falls back to static copy if absent.

### 4. End state after init (before manual finalize)

- Capture: **ENABLED** for `LUMINAFORGE`
- Allow-list: **none** (or disabled until Generate Allow List)
- Monitored Apps: capture on, not yet ENFORCED · LOG

After **Generate Allow List**: same as today (ENFORCED · LOG, block off).

### 5. Confirm dialog copy

**Before:** “built-in benign SQL baseline (no manual capture)”  
**After:** “Clears policy, starts capture, and seeds baseline benign SQL. You will finish with Stop SQL capture → Generate Allow List.”

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Presenter forgets Generate Allow List | Modal + output console reminder; capture stays visible in View capture status |
| Stop then Generate is redundant | Document that Generate also stops capture; both buttons kept per presenter script |
| Init succeeds but LuminaForge down | HTTP training still fails fast (existing behavior from session-context change) |

## Migration Plan

Deploy Aegis Vault UI + demo-control change only. No Oracle package migration required. Existing demos: re-run init if mid-capture state is confusing.

## Open Questions

None.
