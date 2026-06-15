## Why

Demo Control sections are tall and use a single three-column grid that places **Protect** beside **View** and **Risk**, which wastes vertical space and hides the primary “harden” action. Presenters also open a separate **Monitored Apps** nav page for policy context that duplicates the dashboard right rail. Tightening Demo Control layout and colocating **Firewall Policy** under **Monitored Apps** on the right improves scanability during live demos.

## What Changes

- **Demo Control layout (sections 1 & 3):** **Protect** actions (green) move to the **upper-right** of each section card (System-wide and LuminaForge). **View** actions (blue) occupy the **left** and **middle** columns in a row below; **Risk** actions (red) occupy the **right** column only.
- **Demo Control layout (section 2):** Compact **Aegis Vault (SOC)** card with the same three-column **View / Risk** pattern (no Protect row—SOC user remains view-only).
- **Demo Control density:** Reduce padding, subtitles, and footer copy so sections **1**, **2**, and **3** use less vertical height.
- **Right rail:** Stack **Firewall Policy** (`PolicyPanel`) **below** **Monitored Apps** on the persistent right column (visible on all main layouts at `lg+`).
- **Command NAV:** Remove **Monitored Apps** as a primary nav destination; monitored-app status remains on the dashboard right rail only.
- **Policy nav:** Keep standalone **Policy** nav item optional—policy is always visible on the right rail; dedicated Policy page may remain for full-width review (no behavior change to API).

## Capabilities

### New Capabilities

- `demo-control-layout`: Demo Control card layout (protect header row, view/risk grid), compact section chrome, right-rail policy placement, Command NAV removal of Monitored Apps.

### Modified Capabilities

- _(none under `openspec/specs/`)_

## Impact

- **aegis-vault/**: `DemoControlPanel.tsx`, `DemoControlButton.tsx` (optional size variant), `Sidebar.tsx`, `sidebar-types.ts`, `page.tsx`, `PolicyPanel.tsx` (spacing only if needed).
- **No database or API changes.**
