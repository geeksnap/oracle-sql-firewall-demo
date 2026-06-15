## Why

Presenter demos need a clear **break-glass** story: an operator intentionally bypasses normal controls to reach elevated SOC tooling. Renaming the sidebar entry from "Demo Control" to **Break-Glass Control** and requiring a break-glass login ritual makes that narrative obvious to the audience. Logging each login as a **Live Violations** row (with Source App **Aegis Vault**) gives an immediate, visible audit trail in the same feed used for SQL Firewall events—without writing to Oracle.

## What Changes

- **Sidebar:** Rename the bottom-left nav button label from **Demo Control** to **Break-Glass Control** (same destructive/red styling).
- **Break-glass modal:** When the user selects **Break-Glass Control**, show a centered modal asking for **Break-Glass User** and **Password**. Demo mode accepts any non-empty values (no real authentication).
- **Live violation event:** On submit, append a synthetic row to **Live Violations** (right rail + Threat Feed) and broadcast via WebSocket with:
  - **Time** — current time (ISO, displayed in local format)
  - **Source App** — `Aegis Vault` (display string, not `AEGIS_APP`)
  - **User** — username entered in the modal
  - **Action** — `Break-Glass Logged in`
  - **SQL** — `N/A`
- **Presenter panel:** After successful break-glass login, show the existing presenter firewall console (today’s `DemoControlPanel` content) under the Break-Glass section; internal panel title updated to match.
- **Persistence across polls:** Server-side in-memory buffer merges break-glass events with Oracle poll snapshots so periodic status updates do not erase synthetic rows.
- **API:** New `POST /api/break-glass/login` (no DB write; emits `violation` + updates merged snapshot).

## Capabilities

### New Capabilities

- `aegis-break-glass-control`: Break-glass nav rename, login modal, synthetic live-violation logging, API + WebSocket integration, and merged violation feed behavior.

### Modified Capabilities

- _(none under `openspec/specs/`)_

## Impact

- **aegis-vault/**: `Sidebar.tsx`, `sidebar-types.ts`, `page.tsx`, `ViolationsTable.tsx`, `lib/types.ts`, new `BreakGlassModal.tsx`, new `lib/break-glass.ts`, new `src/app/api/break-glass/login/route.ts`, `lib/poller.ts` (merge synthetic rows), `lib/poller-registry.ts` (emit helper), `DemoControlPanel.tsx` (section title only), `SPEC-aegis.md` (nav label delta)
- **Oracle DB:** No schema or package changes
- **LuminaForge:** Unchanged
