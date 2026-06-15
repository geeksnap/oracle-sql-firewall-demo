## Context

- LuminaForge benign traffic is documented in demo scripts (SELECTs on `portfolio`, `transactions`, `users`, `luxury_items`).
- `clear_firewall_policy` (v2.7.0) drops allow-list + capture → **POLICY CLEARED**.
- `GENERATE_ALLOW_LIST` requires stopped capture logs—presenters should not depend on that for the default path.
- Oracle 26ai supports **`DBMS_SQL_FIREWALL.IMPORT_ALLOW_LIST`** from a JSON CLOB without live capture.

## Goals / Non-Goals

**Goals:**

- One button installs a **repeatable demo baseline** for luminaforge: allow-list present, SQL Monitor ON, Block OFF, capture not running.
- Allow-list covers **benign app SQL** so typical dashboard queries pass; attack SQL from the hack script still violates when monitor is on.

**Non-Goals:**

- Auto-run on app startup (manual button only).
- Default policy for `AEGIS_APP`.
- Replacing capture-based training for advanced demos (capture buttons stay).

## Decisions

### 1. Mechanism: `IMPORT_ALLOW_LIST` + bundled JSON

1. `clear_firewall_policy('luminaforge')` if allow-list or capture exists (idempotent reset).
2. `IMPORT_ALLOW_LIST(username => 'LUMINAFORGE', allow_list => l_clob)` using repo file `sql/luminaforge_default_allowlist.json`.
3. `ENABLE_ALLOW_LIST(username, enforce => ENFORCE_ALL, block => FALSE)` — **DETECT · LOG ONLY** demo default.
4. Do **not** `CREATE_CAPTURE` / `START_CAPTURE`.

**Rationale:** Deterministic, no presenter capture step. JSON is produced once (dev DB: run benign SQL as luminaforge → capture → generate → `EXPORT_ALLOW_LIST` → commit file).

**Alternative:** Hidden bootstrap capture inside PL/SQL then `DROP_CAPTURE` — rejected for opacity and dependency on capture timing.

### 2. Package API

```sql
PROCEDURE init_default_demo_policy(p_username IN VARCHAR2, p_msg OUT VARCHAR2);
```

- Reject `AEGIS_APP` (-20007).
- Load CLOB from `sql/luminaforge_default_allowlist.json` via SQL*Plus `@` is not available in package—**embed CLOB in package body** or store in `SYS` table. **Pragmatic v1:** ship `sql/luminaforge_default_allowlist.sql` run by grant script to populate a small `SYS.aegis_demo_allowlist_clob` table, or **inline CLOB constant** in package body (maintained from JSON export). Design task: prefer **separate `.sql` fragment** included in `Oracle_DB_Demo_Control_Grant.sql` that registers CLOB in package spec via `FUNCTION default_allowlist_json RETURN CLOB`.

Simpler v1 for implementer: **PL/SQL reads pre-validated JSON from a VARCHAR2/CLOB literal** in `Oracle_DB_Luminaforge_Default_Allowlist.sql` included at compile time.

### 3. Demo action `init-default-policy`

- Scope: **luminaforge** only.
- Confirm: “Load default demo policy for luminaforge? Replaces current allow-list. Capture is not started.”
- Mutating; refresh Monitored Apps after success.

### 4. UI placement

Button in **§3.3 Firewall setup** (top of column, `variant="success"`), above “Start SQL capture”:

| Order | Label |
|-------|--------|
| 1 | **Initialize default demo policy** |
| 2 | Start SQL capture |
| … | existing buttons |

User message said “3.2 Firewall setup”; in the current grid **3.2 = Firewall info**, **3.3 = Firewall setup** — button goes in **3.3**.

### 5. Default allow-list content

Minimum canonical SQL (normalized for firewall):

- `SELECT` portfolio by `user_id` / `symbol`
- `SELECT` transactions by `user_id` / ordered
- `SELECT` users by `username`
- `SELECT` luxury_items by `category`
- `SELECT 1 FROM DUAL` (health checks if any)

Attack patterns (OR injection, UNION, DELETE) **excluded** intentionally.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| JSON export from different DB version | Document export steps; validate on 26ai PDB |
| IMPORT fails if allow-list still enabled | Always disable/drop before import |
| Schema/table names change | Re-export JSON when `Oracle_DB_Setup.sql` changes |
| Large CLOB in package body | Keep JSON file + install script separate from body |

## Migration Plan

1. Generate `luminaforge_default_allowlist.json` on reference PDB (document in `#Document/`).
2. Deploy package v2.8.0 as SYS.
3. Presenter flow: **Initialize default demo policy** → enable block / run attacks as today.

## Open Questions

- None blocking v1. Future: `GENERATE_ALLOW_LIST` button after capture stop.
