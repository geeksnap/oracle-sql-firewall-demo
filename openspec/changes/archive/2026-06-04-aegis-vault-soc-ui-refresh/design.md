## Context

Aegis Vault is a Next.js 15 SOC dashboard (`aegis-vault/`) polling `DBA_SQL_FIREWALL_VIOLATIONS` as `AEGIS_APP`. Demo Control already drives global enable/disable via `SYS.aegis_demo_control`. The header currently shows `firewall_enabled: true` hardcoded in `buildMetrics()` and labels the sync interval “Poll sync”. Sidebar places Demo Control mid-list with magenta accent. Shield uses a 360px wireframe globe.

Constraints: `oracledb` Thin Mode; existing socket.io poller; no arbitrary SQL from client.

## Goals / Non-Goals

**Goals:**

- User-visible **Status Update** terminology everywhere “Poll” appeared in UI copy.
- Demo Control last in Command NAV with **dark red** active styling.
- Larger, elegant **Aegis Shield** hero on dashboard.
- Header **Firewall** pill reflects **global** SQL Firewall on/off from DB; updates after Demo Control global toggles and on each status refresh cycle.
- Demo Control sections use **left (green) | center (blue) | right (red)** button columns.
- Monitored Apps cards show **per-user SQL Firewall control status** instead of a generic ONLINE pill.

**Non-Goals:**

- Renaming internal TypeScript symbols (`pollCycleMs`, `startViolationPoller`) unless trivial alias exports.
- LuminaForge app changes.
- New database packages (read status via existing viewer grants / definer views).

## Decisions

### 1. Status Update copy scope

**Decision:** Change display strings only: Header “Poll sync” → “Status Update”, footer/help text, SPEC-aegis.md. Keep socket event names (`db-status`, `metrics`) unchanged.

**Rationale:** Avoid breaking socket clients; presenters only see UI labels.

### 2. Demo Control nav placement and color

**Decision:** Split `NAV_ITEMS` into `PRIMARY_NAV` + `DEMO_CONTROL_NAV` rendered with `mt-auto` on Demo Control. Active Demo Control: border/background/text `#7f1d1d` / `#991b1b` / `#fecaca` (dark red), glow `rgba(127,29,29,0.35)`.

**Alternative:** Keep single array with sort — rejected; explicit split clarifies bottom pinning.

### 3. Global firewall status source

**Decision:** Add `fetchGlobalFirewallStatus()` in `lib/db/queries.ts` querying `SELECT status FROM dba_sql_firewall_status` (map `ENABLED`/`DISABLED` to boolean). Include in poll snapshot and `GET /api/metrics`. On successful `firewall-disable` / `firewall-enable`, emit socket `firewall-status` or patch metrics in demo-control API response; client sets `firewallActive` optimistically then confirms on next status update.

**Rationale:** Header must reflect DB truth, not hardcoded `true`.

### 4. Shield enlargement

**Decision:** Increase dashboard shield container to ~`min-h-[480px]` / `lg:min-h-[520px]`; refine `ShieldGlobe` → optional rename `AegisShield` with layered SVG/CSS crest overlay + larger Three.js icosahedron, slower rotation, gold/cyan rim for “elegant” demo look. Keep `@react-three/fiber` (already a dependency).

**Alternative:** Static PNG — rejected; loses live alert coloring.

### 5. Demo Control tri-column layout

**Decision:** Per section, use `grid grid-cols-3 gap-2` with semantic slots:

| Column | Variant | Actions (global) | Actions (per-app) |
|--------|---------|------------------|-------------------|
| Left (green) | `success` | Firewall on globally | Block attacks |
| Center (blue) | `info` (new) | View violations (all) | Allow attacks still log; View violations; View allow-list; View capture |
| Right (red) | `danger` | Firewall off globally; Clear all violation logs | Stop allow-list enforcement; Clear violation logs |

**Clarification:** User text said both red and green “at right”; implementation uses **left=green, right=red** (standard harm/protect layout). Document in SPEC.

Add `variant="info"` to `DemoControlButton` (cyan/blue, no magenta hover).

### 6. Demo Control API feedback for header

**Decision:** Extend `POST /api/demo-control/execute` success payload with `firewallGloballyEnabled?: boolean` when action is `firewall-disable` | `firewall-enable`. `DemoControlPanel` calls `window.dispatchEvent` or optional callback prop — prefer lifting state: pass `onFirewallGlobalChange` from `page.tsx`.

### 7. Monitored Apps firewall control status

**Decision:** Extend poll snapshot to load allow-list rows for `AEGIS_APP` and `LUMINAFORGE` from `dba_sql_firewall_allow_lists` (`username`, `status`, `block`, `enforce`). Add to `MonitoredAppStatus`:

- `firewall_control_label: string` — presenter-facing short text (e.g. `ENFORCED · BLOCK`, `ENFORCED · LOG`, `ALLOW-LIST OFF`, `NOT CONFIGURED`)
- `firewall_control_tone: 'protect' | 'warn' | 'off' | 'unknown'` — drives pill color

**Mapping (global firewall ON):**

| DB `status` | `block` | Label |
|-------------|---------|--------|
| ENABLED | true | ENFORCED · BLOCK |
| ENABLED | false | ENFORCED · LOG |
| DISABLED | * | ALLOW-LIST OFF |
| (no row) | * | NOT CONFIGURED |

When global SQL Firewall is OFF (`dba_sql_firewall_status`), label both apps `FIREWALL OFF` regardless of per-user rows.

**UI:** Replace the right-hand pill text `online` with `firewall_control_label`. If `violation_count > 0`, keep card border/background **alert** styling and optionally prefix pill with `ALERT ·` or show violations on the detail line (unchanged).

**Query fix:** Today `policiesSql` reads `dba_sql_firewall_captures` into `FirewallPolicy` — split into `captures` (for Capture ON/OFF line) and `allowLists` (for control status). If allow-list SELECT fails for AEGIS_APP, call `SYS.aegis_demo_control.view_allow_list` via existing definer pattern (batch both users in one poll).

**Alternative:** Keep ONLINE for connection — rejected; user asked to replace ONLINE with firewall control status.

## Risks / Trade-offs

- **[Risk] `dba_sql_firewall_status` not visible to AEGIS_APP** → Fall back to definer `view_*` package or show “UNKNOWN”; log once.
- **[Risk] Status lags one cycle** → Optimistic header update on successful global toggle.
- **[Risk] Three-column layout wraps on narrow screens** → `grid-cols-1 md:grid-cols-3` with column labels on mobile.
- **[Risk] Allow-list view blocked for AEGIS_APP** → Use definer `view_allow_list` in poll path (same as Demo Control).

## Migration Plan

1. Implement UI/copy changes in `aegis-vault/`.
2. No DB migration; verify `dba_sql_firewall_status` SELECT works as `AEGIS_APP`.
3. Restart `npm run dev`; presenters hard-refresh browser.

## Open Questions

- Confirm `dba_sql_firewall_status.STATUS` values on 26ai (`ENABLED` vs `ON`) during apply—map both if needed.
