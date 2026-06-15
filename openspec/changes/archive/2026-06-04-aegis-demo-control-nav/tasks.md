## 1. Database grants (SYS, one-time)

- [x] 1.1 Create `Oracle_DB_Demo_Control_Grant.sql` with `SYS.aegis_demo_control` package (`AUTHID DEFINER`) wrapping ENABLE/DISABLE, allow-list block on/off, DISABLE_ALLOW_LIST, PURGE_LOG, FLUSH_LOGS, and capped SELECT helpers for PDB `AHDB2605_PDB1`
- [x] 1.2 Grant `EXECUTE` on the package to `AEGIS_APP`; document run order in `#Document` or README snippet

## 2. Backend — demo control API

- [x] 2.1 Add `lib/db/demo-control.ts` with action enum, SQL/PLSQL mapping, and `executeDemoAction(scope, action)` using `withConnection` + definer package calls
- [x] 2.2 Add `POST /api/demo-control/execute` route validating `{ scope, action }` and returning `{ sql, output, ok }`
- [x] 2.3 After mutating actions, call `aegis_fw_flush_logs` and trigger immediate `runPollCycle` from server (export poller hook or internal HTTP-less invoke)

## 3. Frontend — navigation and layout

- [x] 3.1 Extend `NavSection` and `Sidebar` with **Demo Control** entry (cyberpunk active/hover styles)
- [x] 3.2 Create `DemoControlPanel.tsx` with four sections: System-wide, Aegis Vault, LuminaForge, Output
- [x] 3.3 Wire `page.tsx` to render `DemoControlPanel` when `section === 'demo-control'`

## 4. Frontend — control buttons and output

- [x] 4.1 Implement `SystemFirewallControls` buttons (global off/on, clear all violations, view all violations)
- [x] 4.2 Implement `AppFirewallControls` for `AEGIS_APP` and `luminaforge` (block on/off, disable allow-list, purge, view DB/allow-list/capture)
- [x] 4.3 Implement `DemoOutputConsole` — monospace, ~15-row visible height, scrollable, append timestamp + SQL + result per action
- [x] 4.4 Add confirm dialogs for destructive actions (global DISABLE, purge)

## 5. Spec and verification

- [x] 5.1 Update `aegis-vault/SPEC-aegis.md` §3 Layout with Demo Control nav and section summary
- [x] 5.2 Manual test: each button executes, Output updates, Threat Feed clears after purge, block on/off changes luminaforge sqlplus behavior
