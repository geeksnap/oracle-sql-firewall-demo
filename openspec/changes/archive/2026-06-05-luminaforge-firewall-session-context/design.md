## Context

Oracle SQL Firewall with `ENFORCE_ALL` checks both allowed SQL and **allowed session contexts** (`CLIENT_PROGRAM`, `OS_USER`, `IP_ADDRESS`). Context violations appear in `DBA_SQL_FIREWALL_VIOLATIONS` with `CAUSE = 'Context violation'` and often **null `SQL_TEXT`** — Aegis maps `CAUSE` to the **Type** column and shows empty **FULL SQL**.

LuminaForge navbar refetches session on every `pathname` change (`NavBar.tsx` → `GET /api/session`). Default demo policy today:

1. `init_default_demo_policy` — start capture
2. `runLuminaforgeBenignBootstrap` via **Aegis Vault's** `withLuminaforgeConnection` (PL/SQL or inline SELECTs)
3. `finalize_default_demo_policy` — `GENERATE_ALLOW_LIST` + `ENABLE_ALLOW_LIST(ENFORCE_ALL, block=FALSE)`

Step 2 captures SQL and session context from the **Aegis Node process**, not from the LuminaForge Next.js server on port 3001. Tab navigation later uses LuminaForge's pool → context mismatch → logged violations.

Bootstrap also omits the exact session API query (`SELECT username, role FROM users WHERE id = :id`); that is a separate SQL-shape gap but not the cause of empty-SQL context rows.

## Goals / Non-Goals

**Goals:**

- After **Initialize default demo policy**, clicking LuminaForge nav tabs does not add Context violation rows to Aegis Latest Threats.
- Session lookup SQL shape is included in benign bootstrap for completeness.
- Presenters understand why some firewall rows have no SQL text.

**Non-Goals:**

- Changing `ENFORCE_ALL` to SQL-only enforcement (would hide real context attacks).
- Debouncing or removing navbar session refresh on navigation.
- Filtering Context violations out of Aegis reporting (report-all policy stays).
- Requiring manual SQL capture training for every demo (default policy path remains one-click).

## Decisions

### 1. HTTP training step from Aegis during init-default-policy

**Chosen:** After capture starts and before finalize, Aegis calls:

- `GET {LUMINAFORGE_BASE_URL}/api/session`
- `GET {LUMINAFORGE_BASE_URL}/api/portfolio`

**Why:** Uses the **same Node process and connection pool** as live tab navigation, so session context and SQL enter capture logs together.

**Alternative — ENFORCE_SQL_ONLY:** Rejected; demo should keep context enforcement to show full firewall capability.

**Alternative — Match oracledb client attributes in code:** Fragile across hosts; does not fix IP/program differences between Aegis and LuminaForge processes.

### 2. LuminaForge must be running during init

**Chosen:** Fail init with actionable message if HTTP training returns connection refused / timeout.

**Why:** Without LuminaForge, we cannot capture its session context; silent partial training reproduces the bug.

### 3. Extend PL/SQL bootstrap with session lookup

**Chosen:** Add parameterized-equivalent benign SELECT in `aegis_demo_bootstrap_benign` (bind simulated as literal `id = 1`) plus inline fallback in `luminaforge-session.ts`.

**Why:** Keeps SQL allow-list aligned even when HTTP step succeeds; dual coverage for SQL + context paths.

### 4. Documentation only for empty FULL SQL

**Chosen:** Add a short **Context violation** subsection to `SPEC-luminaforge.md`; no Aegis UI change in this change.

**Why:** Smallest fix; presenters already see Type = Context violation.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| LuminaForge not running during init | Clear error in Demo Control output; document in SPEC |
| Different host in OCI (not localhost) | `LUMINAFORGE_BASE_URL` env on Aegis vault |
| Re-init policy on running demo without restart | Document: re-run init after LuminaForge URL/host changes |
| HTTP step adds latency to init | Acceptable; one-time presenter action |

## Migration Plan

1. Deploy SQL bootstrap procedure update (`@Oracle_DB_Demo_Control_Grant.sql` or standalone `luminaforge_bootstrap_benign.sql` re-run).
2. Deploy Aegis + LuminaForge code changes.
3. Presenters re-run **Initialize default demo policy** with LuminaForge up.
4. Optional: purge existing context violation noise via Demo Control **Clear violation logs**.

## Open Questions

None — scope is intentionally minimal.
