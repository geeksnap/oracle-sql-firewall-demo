## Why

Presenters need a **one-click baseline** for LuminaForge SQL Firewall demos without running SQL capture training first. Today they must capture traffic, generate an allow-list, and enable monitor—a long preamble. A bundled **default allow-list** (log-only enforcement) lets the demo start at “protected app ready for attack simulation.”

## What Changes

- **Oracle package (v2.8.0):** New `init_default_demo_policy` for **luminaforge** — installs a curated allow-list via `IMPORT_ALLOW_LIST` (or equivalent bootstrap), enables SQL Monitor with **Block SQL OFF**, and does **not** start SQL capture.
- **Repo asset:** Version-controlled allow-list export (JSON CLOB) derived from LuminaForge benign queries (portfolio, transactions, users, luxury_items).
- **Demo Control §3.3 Firewall setup:** Button **Initialize default demo policy** calling `init-default-policy` (confirm dialog). *(UI column is **3.3 Firewall setup**; “3.2” in requests maps to the setup column, not the info column.)*
- **Posture UI:** After init, Monitored Apps shows **ENFORCED · LOG** (not POLICY CLEARED); capture remains OFF.

## Capabilities

### New Capabilities

- `luminaforge-default-firewall-policy`: Bundled default allow-list, package procedure, Demo Control button, luminaforge-only scope.

### Modified Capabilities

- _(none under `openspec/specs/`)_

## Impact

- **Oracle:** `Oracle_DB_Demo_Control_Grant.sql`, new `sql/luminaforge_default_allowlist.json` (or `.sql` CLOB loader)
- **aegis-vault:** `demo-control-types.ts`, `demo-control.ts`, `LuminaforgeFirewallControlCenter.tsx`, `build-info.json` → 2.8.0
- **Docs:** Optional note in `#Document/Demo_Control_Setup.md` for first-time demo flow
