## Why

Presenter demos need clearer SOC labeling, a more prominent Aegis shield hero, live global firewall status in the header, per-app firewall control visibility in Monitored Apps, and a Demo Control layout that visually separates risky (red), protective (green), and informational (blue) actions. Today “Poll” terminology is internal, Demo Control sits mid-nav in magenta, the shield is modest, header firewall state does not track global on/off, Monitored Apps show only **ONLINE** / **ALERT** (not SQL Firewall allow-list state), and demo buttons are an undifferentiated grid.

## What Changes

- **BREAKING (UI copy):** Rename user-visible “Poll” / “poll” wording to **Status Update** (header label, socket events documentation in SPEC, any visible console/help text). Internal code identifiers (`poller`, `pollCycleMs`) may stay for stability unless renamed in a follow-up.
- **Command NAV:** Move **Demo Control** to the **bottom** of the sidebar list; style active/inactive states with **dark red** (`#8B0000` / deep crimson) instead of magenta.
- **Shield hero:** Enlarge and redesign the dashboard shield (Three.js / CSS) into a more elegant **Aegis Shield** logo treatment—larger footprint, refined geometry, subtle animation.
- **Header FIREWALL pill:** Reflect **live global SQL Firewall status** from the database; update immediately when **Firewall off globally** / **Firewall on globally** succeeds in Demo Control (and on initial load / status refresh).
- **Demo Control button layout:** Three-column rows per section—**green** (protective) commands on the **left**, **blue** (neutral/view) in the **center**, **red** (negative / reduces protection) on the **right**. *(User message listed both red and green “at right”; design assumes left=green, center=blue, right=red—standard SOC affordance.)*
- **Monitored Apps:** Replace the generic **ONLINE** status pill with each app’s **SQL Firewall control status** (allow-list enabled/disabled, block on/off, enforcement) sourced from `dba_sql_firewall_allow_lists`. Keep violation-driven **ALERT** emphasis when recent violations exist.

## Capabilities

### New Capabilities

- `soc-ui-refresh`: Command NAV ordering and Demo Control styling, Status Update terminology, enlarged Aegis shield, header firewall status sync, Demo Control tri-column button layout, Monitored Apps per-user firewall control status.

### Modified Capabilities

- _(none — prior `demo-control` change not archived under `openspec/specs/`; delta captured in `aegis-vault/SPEC-aegis.md` during apply)_

## Impact

- **aegis-vault/**: `Header.tsx`, `Sidebar.tsx`, `ShieldGlobe.tsx` (or replacement `AegisShield.tsx`), `DemoControlPanel.tsx`, `DemoControlButton.tsx`, `MonitoredAppsPanel.tsx`, `lib/db/queries.ts`, `lib/types.ts`, `page.tsx`, `lib/poller.ts`, `server.ts` socket payloads, optional `GET /api/firewall-status` or extend existing metrics API.
- **Database:** Read global status via `dba_sql_firewall_status` and per-user allow-list via `dba_sql_firewall_allow_lists` as `AEGIS_APP`; use existing `view_allow_list` definer path if direct SELECT is blocked (ORA-47605).
- **LuminaForge:** No changes.
