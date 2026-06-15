# Aegis Vault – Oracle SQL Firewall Defense Dashboard
## OpenSpec v1.2 – Cross-Monitoring Edition (June 2026)

### 1. Executive Summary
Futuristic cyber-defense command center that monitors both itself (AEGIS_APP) and LuminaForge (luminaforge user) in real-time. Visual “wow” SOC dashboard for Oracle SQL Firewall demos.

### 2. Visual Design System
- Theme: Cyberpunk Defense HQ (#0a0a0f background)
- Accents: Neon Cyan (#00f9ff), Magenta (#ff00aa), Safe Green (#00ff9f), Alert Red (#ff2d55)
- 3D: Compact rotating force-field shield globe (~360px, Three.js wireframe + sparkles) with particle effects
- Animations: Framer Motion, glassmorphism panels, scanline overlay

### 3. Layout
- Header: Logo + “AEGIS VAULT” + Global Firewall Status
- Left Sidebar (**Command Nav**): **Dashboard** | **Break-Glass Control** (bottom only)
- Center: 3D Shield Globe + Live Metrics Cards + Latest Threats (Dashboard), or Break-Glass presenter panel when selected
- **Metrics cards:** Total Violations, LuminaForge Hits, and Aegis Hits count from the latest **200** `dba_sql_firewall_violations` rows per status update (not capped at 50). Fourth card label: **Last Update** (timestamp of last successful refresh; API field `last_poll_at` unchanged).
- Right: **Live Violations** (compact: Time, Source App, Type) + Monitored Apps / Policy panels

### 3.1 Break-Glass Control (Presenter Panel)
- **Break-glass login:** selecting **Break-Glass Control** in the sidebar always opens a centered modal (Break-Glass User + Password) — login is required on every sidebar click, not once per session. Navigating away clears the grant so the next click requires re-authentication. Demo mode accepts any non-empty user and any password; password is not logged. `POST /api/break-glass/login` records a synthetic Live Violations row (Source App `Aegis Vault`, Action `Break-Glass Logged in`, SQL `N/A`) and emits WebSocket `violation` on every login. Rows persist in-memory across status polls (not written to Oracle dictionary).
- **Compact Live Violations:** for `source_app === "Aegis Vault"`, the Type column shows `action_label` (e.g. `Break-Glass Logged in`).
- **System-wide Firewall Control:** global ENABLE/DISABLE, purge all violation logs, view all violations
- **Aegis Vault Firewall Control:** per-user `AEGIS_APP` block on/off, disable allow-list, purge, view DB status
- **LuminaForge Firewall Control:** per-user `luminaforge` (same buttons as Aegis section)
- **Output:** scrollable ~15-row console showing executed SQL and results
- Requires `Oracle_DB_Demo_Control_Grant.sql` run as SYS (`SYS.aegis_demo_control` package)

### 4. Multi-App Monitoring (Key Feature)
- Monitored Apps Panel shows AEGIS_APP and luminaforge **SQL Firewall control status** (allow-list / block), not generic ONLINE
- **Latest Threats** (Dashboard): occupies ~**half** of the center column below metrics/globe, stretching to the bottom of the **Command Nav** row on large screens; violations table (~2/3 of that block) with **Full SQL** below (~1/3). Shows **all** violations in the current ledger (up to **200** per status update, scroll inside panel). Table columns: Time, Source App, Type, Action (no **User** column). Click a row to show full `sql_text`. **No deduplication** of repeat firewall log rows in the ledger.
- **Live Violations** (right rail): same ledger as Latest Threats (up to **200** rows, scroll); compact columns Time, Source App, Type only (no **User**).
- No separate Threat Feed or All Violations nav sections; violation detail is on **Dashboard** (Latest Threats + Full SQL) and the right-rail **Live Violations** compact table.
- Shield globe: each **new** firewall violation triggers a **10-second red flash**; if violations remain afterward, the globe settles to **steady yellow** (warning pulse). Label shows “LuminaForge Attacked” on attack-alert, otherwise “SQL Firewall Violation Detected”. Returns to cyan when violation logs are purged empty.

### 5. Database & Firewall
- Primary user: AEGIS_APP
- Monitors: AEGIS_APP + luminaforge
- Uses DBA_SQL_FIREWALL_VIOLATIONS etc.

### 6. Backend API (Node.js)
- GET /api/violations?user=all
- WebSocket: violation events with source_app; periodic **Status Update** cycle (header label; internal poll interval via `POLL_INTERVAL_MS`)

### 7. Tech Stack
Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, @react-three/fiber, Socket.io, oracledb

**End of SPEC.md – Cursor: build the complete application from this spec**


