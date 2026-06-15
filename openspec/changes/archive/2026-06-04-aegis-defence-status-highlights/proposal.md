## Why

Presenters need **Demo Control** to read as a distinct, always-visible “danger zone” in Command NAV (dark red even when not selected), and Monitored Apps needs **clear defence-status highlighting** so each app’s SQL Firewall posture is obvious at a glance—not only a small pill with generic tone colors.

Backend mapping for pill labels already exists (`ENFORCED · BLOCK`, etc.); this change focuses on **nav styling** and **per-state visual emphasis** in the panel.

## What Changes

- **Command NAV — Demo Control:** Use **dark red** text and border styling for the Demo Control item in **both active and inactive** states (inactive must not fall back to slate/gray like other nav items).
- **Monitored Apps — defence highlight:** For each app card, apply **label-specific** pill and card accent styles for the five defence states:

  | Condition | Pill label |
  |-----------|------------|
  | Allow-list on + block | `ENFORCED · BLOCK` |
  | Allow-list on, log only | `ENFORCED · LOG` |
  | Allow-list off | `ALLOW-LIST OFF` |
  | Global firewall off | `FIREWALL OFF` |
  | No allow-list row | `NOT CONFIGURED` |

- Optional stable `defence_status` key on `MonitoredAppStatus` (derived from same mapper as labels) so UI does not key styles on free-form strings.

## Capabilities

### New Capabilities

- `defence-status-ui`: Always-red Demo Control nav item; Monitored Apps per-defence-state highlights.

### Modified Capabilities

- _(none)_

## Impact

- **aegis-vault/**: `Sidebar.tsx`, `MonitoredAppsPanel.tsx`, optionally `lib/types.ts` + `lib/db/queries.ts` (add `defence_status` enum field).
- No database or API route changes required if labels already populated.
