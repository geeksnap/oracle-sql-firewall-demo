## Context

Aegis Vault is a Next.js 15 + custom `server.ts` app connecting as `AEGIS_APP` to PDB `AHDB2605_PDB1`. It polls `DBA_SQL_FIREWALL_VIOLATIONS` and displays a cyberpunk SOC UI. Demo presenters currently run `DBMS_SQL_FIREWALL` PL/SQL as SYS in a separate session to toggle firewall state and purge logs.

Constraints:
- `oracledb` Thin Mode only; `try/catch/finally` with `connection.close()` in `finally`.
- `AEGIS_APP` has `SQL_FIREWALL_VIEWER` but not `DBMS_SQL_FIREWALL` admin.
- Existing `SYS.aegis_fw_flush_logs` definer procedure (from `Oracle_DB_Aegis_Flush_Grant.sql`).

## Goals / Non-Goals

**Goals:**
- Add **Demo Control** nav with four UI sections matching presenter workflow.
- Button-driven, whitelisted SQL only (no free-text SQL from browser).
- Append each action’s SQL text and result (success rows, ORA errors, row counts) to a scrollable Output panel (~15 lines visible).
- Support global actions (Part 1) and per-user actions for `AEGIS_APP` and `luminaforge` (Parts 2–3).
- Match existing glassmorphism / neon cyberpunk styling.
- After mutations, call flush + emit socket refresh hint for violations snapshot.

**Non-Goals:**
- LuminaForge UI changes.
- Arbitrary SQL worksheet in the browser.
- Production-grade RBAC beyond demo definer procedures.
- Persisting output history across server restarts.

## Decisions

### 1. Privilege model: SYS definer procedure package

**Decision:** Add `Oracle_DB_Demo_Control_Grant.sql` creating `SYS.aegis_demo_control` package (`AUTHID DEFINER`) with one function per whitelisted action; grant `EXECUTE` to `AEGIS_APP`.

**Rationale:** `AEGIS_APP` cannot call `DBMS_SQL_FIREWALL` directly. Definer package keeps credentials out of the Node app and limits attack surface to enumerated operations.

**Alternative considered:** Second `.env` connection as SYS — rejected (password in app, broader exposure).

### 2. API shape

**Decision:** `POST /api/demo-control/execute` with body `{ scope: 'global' | 'aegis' | 'luminaforge', action: '<enum>' }`.

Server maps `action` → PL/SQL call + optional follow-up SELECT for “View in DB”. Response: `{ sql: string, output: string, ok: boolean }`.

**Rationale:** Single endpoint simplifies Output panel append logic; enum prevents injection.

### 3. Action matrix

| Action ID | Part 1 (global) | Part 2 (AEGIS_APP) | Part 3 (luminaforge) |
|-----------|-----------------|--------------------|-----------------------|
| `firewall-disable` | ✓ | — | — |
| `firewall-enable` | ✓ | — | — |
| `block-on` | — | ✓ | ✓ |
| `block-off` | — | ✓ | ✓ |
| `allow-list-disable` | — | ✓ | ✓ |
| `purge-violations` | ✓ (both users) | ✓ (user only) | ✓ (user only) |
| `view-violations` | ✓ (all monitored) | ✓ (user) | ✓ (user) |
| `view-allow-list` | — | ✓ | ✓ |
| `view-capture-status` | — | ✓ | ✓ |

Global purge clears `luminaforge` + `AEGIS_APP` violation logs. Per-app purge clears one user.

### 4. UI component structure

**Decision:** `DemoControlPanel.tsx` with subcomponents `SystemFirewallControls`, `AppFirewallControls` (props: `app: 'AEGIS_APP' | 'luminaforge'`), `DemoOutputConsole`.

Layout: stacked glass panels in main content column; Output fixed at bottom with `min-h-[15rem] max-h-[15rem] overflow-y-auto` monospace font.

### 5. Output console behavior

**Decision:** Client keeps `outputLog: string[]`; each button click appends timestamp, SQL, separator, result. Auto-scroll to bottom on append.

### 6. Nav integration

**Decision:** Extend `NavSection` with `'demo-control'`; Sidebar label **Demo Control** with distinct accent (e.g. magenta border when active).

## Risks / Trade-offs

- **[Risk] Definer package misuse if EXECUTE leaked** → Mitigation: grant only to `AEGIS_APP`; document demo-only; no user-supplied SQL.
- **[Risk] Accidental production firewall disable** → Mitigation: confirm dialog for global DISABLE; label buttons clearly.
- **[Risk] Large violation query fills output** → Mitigation: cap “View in DB” at 20 rows in PL/SQL or post-process in Node.
- **[Risk] PDB container** → Mitigation: definer procedures run `ALTER SESSION SET CONTAINER = AHDB2605_PDB1` on entry.

## Migration Plan

1. Run `Oracle_DB_Demo_Control_Grant.sql` as SYS in PDB (after existing setup scripts).
2. Deploy updated `aegis-vault` code.
3. Verify Demo Control buttons with Aegis Vault running on port 3000.
4. Rollback: disable nav route; DB package can remain (inert).

## Open Questions

- Whether to add confirmation modals for all destructive actions (recommended: yes for DISABLE and PURGE).
- Optional: add “View in app” helper text pointing to Threat Feed nav (no extra SQL).
