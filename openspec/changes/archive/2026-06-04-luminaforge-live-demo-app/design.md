## Context

LuminaForge is the **victim/target** app in the Oracle 26ai SQL Firewall demo;
Aegis Vault is the already-built **defender** SOC. The `luminaforge` DB user and
its 4 tables already exist in PDB `AHDB2605_PDB1` (verified by
`demo_schema_Creation_20260601.log`), and SQL Firewall capture is enabled for
the `luminaforge` user. This change designs the LuminaForge front end + backend
so that 4 ordinary-looking inputs are secretly SQL-injection vectors that the
Firewall kernel records into `SYS.DBA_SQL_FIREWALL_VIOLATIONS`, which Aegis Vault
then broadcasts.

**Ground-truth constraints (from `Oracle_DB_Setup.sql` + the creation log):**

| Table | Columns (verified) |
|---|---|
| `users` | `id NUMBER (identity PK)`, `username VARCHAR2(50)`, `password VARCHAR2(100)`, `role VARCHAR2(20)` |
| `portfolio` | `id` PK, `user_id NUMBER`, `symbol VARCHAR2(20)`, `quantity NUMBER`, `avg_price NUMBER` |
| `transactions` | `id` PK, `user_id NUMBER`, `type VARCHAR2(20)`, `amount NUMBER`, `timestamp TIMESTAMP` |
| `luxury_items` | `id` PK, `name VARCHAR2(100)`, `price NUMBER`, `category VARCHAR2(50)` |

Seed rows: `users` → 2 rows (`demo_user` / `Wealth#2026!` / `premium` and
`admin` / `Sup3rSecretAdmin#` / `admin`); `portfolio` → 2 rows (AAPL, ORCL for
user 1); `luxury_items` → 1 row (`Rolex Submariner` / 12500 / `watch`);
`transactions` → empty.

> **Schema change (this proposal):** `users` gains a `password VARCHAR2(100)`
> column and a seeded `admin` row in `Oracle_DB_Setup.sql`, so the Point 3
> "credential leak" surfaces real **username + password + role** — including the
> admin's password — for a dramatic "leaked the credentials table" moment. The
> updated Setup SQL must be re-deployed (cleanup + re-run); the historical
> `demo_schema_Creation_20260601.log` predates this column.

## Goals / Non-Goals

**Goals:**
- A polished Dark Luxury fintech UI where 4 attack inputs look like real B2C
  product features (universal search, memo filter, tax-ID field, batch note).
- 4 reproducibly hackable endpoints via raw string concatenation against the
  verified `luminaforge` schema.
- Run independently of Aegis Vault (own port `3001`, own `.env`) so both apps
  run side by side during the demo.
- Keep `/api/ai-query` (Lumina assistant) safe via the SQLcl MCP path to show
  the safe-vs-unsafe contrast.

**Non-Goals:**
- No changes to `Oracle_DB_Setup.sql`, the schema, or Aegis Vault code.
- No real authentication/authorization — `demo_user` (id 1) is the implicit
  session; "other users" are simulated by the data the injections reach.
- No production hardening of the 4 vulnerable routes (the opposite is the point).
- The Firewall enable/block/allow-list posture is driven from **Aegis Vault Demo
  Control**, not from LuminaForge.

## Decisions

### Decision 1 — Section 1: UI camouflage & hacking-prompt mapping

Each attack is a normal-looking control. The presenter pastes a benign value
first (normal result), then the payload (attack result).

| # | DB attack class | UI camouflage (where it lives) | Demo payload | Visible effect |
|---|---|---|---|---|
| 1 | Boolean `OR 1=1` bypass | **Lux-Asset / Ticker Universal Search Bar** in top nav (Market Explorer) | `' OR '1'='1` | Grid dumps ALL `luxury_items` incl. "hidden"/unlisted rows |
| 2 | Conditional data exfiltration | **Transaction Memo / Reference ID Filter** text field in advanced-search drawer (Transaction History) | `x' OR user_id<>1 --` | Leaks OTHER users' `transactions` rows |
| 3 | `UNION SELECT` column leak | **Tax Institution ID** text input on tax-doc download page (Custom Statement) | `0 UNION SELECT id, username, password, role FROM users` | `users.username` + `password` + `role` (incl. admin) rendered into the formatted statement grid |
| 4 | Stacked `;` destructive query | **Batch Execution Note** textarea in bulk asset-transfer flow | `note'; UPDATE users SET role='admin' WHERE id=1 --` | Second statement silently tampers data behind a normal "transfer complete" UI |

Naming each control with finance jargon ("Reference ID Filter", "Tax Institution
ID", "Batch Execution Note") is what makes the injection invisible to an audience.

### Decision 2 — Section 2: intentional vulnerable code specification

All 4 routes build SQL by **string interpolation of the raw request value** and
call `connection.execute(sql)` with **no bind variables**. `node-oracledb`
supports binds (`:1`) and we deliberately do NOT use them here. (The safe AI
route is shown last for contrast.)

**Point 1 — `POST /api/market/search` (boolean bypass):**

```ts
// luminaforge/src/app/api/market/search/route.ts  — INTENTIONALLY VULNERABLE
const { q } = await req.json();
// VULNERABLE: raw concatenation, no binds. Payload: ' OR '1'='1
const sql = `SELECT id, name, price, category
             FROM luxury_items
             WHERE name LIKE '%${q}%'`;
const result = await conn.execute(sql); // node-oracledb, NO bind args
return Response.json(result.rows);
```

**Point 2 — `POST /api/transactions/filter` (conditional exfiltration):**

```ts
// luminaforge/src/app/api/transactions/filter/route.ts — INTENTIONALLY VULNERABLE
const { ref } = await req.json(); // "Transaction Memo / Reference ID"
// VULNERABLE: attacker breaks out of the user_id scope. Payload: x' OR user_id<>1 --
const sql = `SELECT id, user_id, type, amount, timestamp
             FROM transactions
             WHERE user_id = 1 AND type = '${ref}'`;
const result = await conn.execute(sql);
return Response.json(result.rows);
```

**Point 3 — `POST /api/statement/generate` (UNION leak):**

```ts
// luminaforge/src/app/api/statement/generate/route.ts — INTENTIONALLY VULNERABLE
const { taxId } = await req.json(); // "Tax Institution ID"
// VULNERABLE: column count/types align to users. Payload:
//   0 UNION SELECT id, username, password, role FROM users
const sql = `SELECT id, type, amount, timestamp
             FROM transactions
             WHERE user_id = ${taxId}`;
const result = await conn.execute(sql);
return Response.json(result.rows); // rendered into statement grid
```

**Point 4 — `POST /api/bulk/execute` (stacked destructive query):**

```ts
// luminaforge/src/app/api/bulk/execute/route.ts — INTENTIONALLY VULNERABLE
const { note } = await req.json(); // "Batch Execution Note"
// VULNERABLE: split on ';' then run each statement, enabling a 2nd command.
// Payload: ok'; UPDATE users SET role='admin' WHERE id=1 --
const sql = `INSERT INTO transactions (user_id, type, amount)
             VALUES (1, 'BULK', 0); -- memo: ${note}`;
for (const stmt of splitStatements(sql)) {   // runs stacked statements
  await conn.execute(stmt);
}
await conn.commit();
return Response.json({ status: "Transfer complete" }); // UI shows success
```

> node-oracledb does not execute multi-statement strings in one `execute()`
> call. To make the **stacked** demo work, Point 4 explicitly splits on `;` and
> executes each fragment — the deliberate flaw that turns one "memo" into two
> SQL commands. Each fragment still reaches the Firewall individually.

**Safe contrast — `POST /api/ai-query` (NOT vulnerable):** natural-language goes
to the Oracle SQLcl MCP server, which returns governed/parameterized SQL; the app
never concatenates user text into SQL here.

### Decision 3 — Section 3: schema mapping & ground-truth verification

Each vulnerable query is checked against the verified columns:

| Route | Base query target | Columns touched | Matches log? |
|---|---|---|---|
| `/api/market/search` | `luxury_items` | `id,name,price,category` | ✅ all 4 exist |
| `/api/transactions/filter` | `transactions` | `id,user_id,type,amount,timestamp` | ✅ all 5 exist |
| `/api/statement/generate` | `transactions` ← `UNION` `users` | base 4 cols vs `users(id,username,password,role)` | ✅ UNION arity = 4; types: NUMBER, VARCHAR2, VARCHAR2, VARCHAR2 align with `(id,type,amount,timestamp)` cast as VARCHAR2 where needed |
| `/api/bulk/execute` | `transactions` INSERT + `users` UPDATE | `transactions(user_id,type,amount)`, `users(role,id)` | ✅ all exist |

UNION type-alignment note: `transactions` projection is `(NUMBER, VARCHAR2,
NUMBER, TIMESTAMP)`. The `users` row now provides 4 typed columns
`(id NUMBER, username VARCHAR2, password VARCHAR2, role VARCHAR2)`. To avoid
ORA-01790 the base SELECT will cast `amount` and `timestamp` as `VARCHAR2` so
all 4 positions are VARCHAR2/NUMBER-compatible with the users projection. Final
column list locked against a live `DESCRIBE` during implementation.

### Decision 4 — Section 4: live demo dataflow matrix

```
[T0] Presenter types payload into LuminaForge Dark-Luxury input
        (e.g. Market Explorer search = "' OR '1'='1")
   │
[T1] React client POSTs JSON → LuminaForge Next.js API route (port 3001)
   │
[T2] Vulnerable route concatenates payload into raw SQL (NO binds)
   │
[T3] oracledb (Thin Mode) sends SQL to PDB AHDB2605_PDB1 as user `luminaforge`
   │
[T4] Oracle SQL Firewall kernel inspects statement vs luminaforge allow-list:
        • allow-list DISABLED → logs as violation, statement still runs
        • allow-list ENABLED + block ON → BLOCK (ORA-47605), logs violation
     → row written to SYS.DBA_SQL_FIREWALL_VIOLATIONS
        (username, sql_text, occurred_at, firewall_action, cause, ip_address)
   │
[T5] LuminaForge UI shows either leaked data (log-only) or a styled error (blocked)
   │
[T6] Aegis Vault poller (server.ts, ~1–3s interval) runs FLUSH_LOGS then
     SELECT ... FROM sys.dba_sql_firewall_violations WHERE username IN
     ('AEGIS_APP','LUMINAFORGE')   ← Aegis already does this
   │
[T7] New violation diffed against seenViolationIds → io.emit('violation') +
     io.emit('attack-alert', {message:'LuminaForge Attacked'})
   │
[T8] Aegis dashboard: red particles on 3D shield globe, Threat Feed row with
     Source App = luminaforge, metrics increment — within ~1 polling cycle.
```

The only coupling between the two apps is the **shared Firewall violations view**;
LuminaForge never calls Aegis directly. Latency T4→T8 is bounded by Aegis's
`POLL_INTERVAL_MS` (default 1000ms; example `.env` uses 3000ms).

### Decision 5 — Section 5: file architecture tree (`./luminaforge`)

```
luminaforge/
├─ .env                      # DB_USER=luminaforge, PORT=3001 (symlinked/independent)
├─ .env.example
├─ package.json              # next 15, react 19, oracledb, socket-free (or own io)
├─ next.config.ts
├─ server.ts                 # custom server, port 3001, guards DB_USER=luminaforge
├─ tsconfig.json / tsconfig.json
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                      # Dark Luxury shell, nav with search bar
│  │  ├─ page.tsx                        # Dashboard + 3D portfolio globe + ticker
│  │  ├─ market/page.tsx                 # Market Explorer (Attack Pt 1 search)
│  │  ├─ transactions/page.tsx           # History + advanced drawer (Attack Pt 2)
│  │  ├─ statement/page.tsx              # Tax-doc download (Attack Pt 3)
│  │  ├─ bulk/page.tsx                   # Bulk asset transfer (Attack Pt 4)
│  │  └─ api/
│  │     ├─ market/search/route.ts       # VULNERABLE — boolean bypass
│  │     ├─ transactions/filter/route.ts # VULNERABLE — conditional exfil
│  │     ├─ statement/generate/route.ts  # VULNERABLE — UNION leak
│  │     ├─ bulk/execute/route.ts        # VULNERABLE — stacked query
│  │     ├─ ai-query/route.ts            # SAFE — SQLcl MCP path
│  │     └─ portfolio/route.ts           # SAFE — parameterized reads
│  ├─ components/
│  │  ├─ UniversalSearchBar.tsx          # camouflage for Pt 1
│  │  ├─ AdvancedSearchDrawer.tsx        # camouflage for Pt 2
│  │  ├─ StatementGrid.tsx               # renders Pt 3 leak as a "statement"
│  │  ├─ BulkActionPanel.tsx             # camouflage for Pt 4
│  │  ├─ PortfolioGlobe.tsx              # 3D globe (react-three-fiber)
│  │  ├─ PriceTicker.tsx
│  │  ├─ GlassCard.tsx
│  │  └─ LuminaAssistant.tsx             # floating safe AI widget
│  └─ lib/
│     ├─ db/
│     │  ├─ pool.ts                       # oracledb Thin pool, try/finally close
│     │  ├─ vulnerable-queries.ts         # raw-concat builders (the 4 flaws)
│     │  └─ safe-queries.ts               # parameterized reads
│     ├─ mcp/sqlcl-client.ts              # safe AI path
│     └─ theme.ts                         # Dark Luxury tokens (#0f172a/#f4c95d)
├─ scripts/
│  └─ reset-demo-data.sql                 # reseed after Pt 4 destructive demo
└─ README.md                              # "intentionally vulnerable — demo only"
```

Port `3001` (LuminaForge) vs `3000` (Aegis Vault) avoids `EADDRINUSE`; both read
the same PDB but as different DB users, so the Firewall attributes traffic
correctly by `username`.

## Risks / Trade-offs

- **Point 4 performs real data tampering** → Mitigation: ship
  `scripts/reset-demo-data.sql` and run it between rehearsals; default the UPDATE
  target to a throwaway value where possible.
- **node-oracledb won't run stacked statements in one call** → Mitigation:
  Point 4 explicitly splits on `;` (documented deliberate flaw) so the stacked
  demo is faithful and each statement still hits the Firewall.
- **Schema re-deploy required** → `Oracle_DB_Setup.sql` now adds
  `password VARCHAR2(100)` and a seeded `admin` row; the demo environment must
  run cleanup + re-run before any app testing. The historical
  `demo_schema_Creation_20260601.log` predates this column.
- **UNION type/arity mismatch (ORA-01790/01789)** → Mitigation: lock the base
  SELECT column list during implementation against a live `DESCRIBE`; align
  count and types before recording the demo.
- **If Firewall allow-list is ENABLED with block ON**, attacks get ORA-47605 and
  leak nothing → that's the intended "blocked" branch; presenter toggles posture
  from Aegis Demo Control to show both log-only and blocked outcomes.
- **Accidental exposure** of intentionally vulnerable routes → Mitigation: README
  + in-file banners; never deploy outside the demo environment.

## Open Questions

1. Should LuminaForge run its own Socket.io for in-app live updates, or stay
   request/response only and let Aegis own all real-time visuals? (Lean: keep
   LuminaForge request/response; Aegis owns the SOC theatrics.)
2. Seed additional `users`/`transactions` rows for more dramatic Pt 2/Pt 3
   leaks? (Requires a seed script; no `Oracle_DB_Setup.sql` change.)
3. Is the SQLcl MCP server already configured/reachable for `/api/ai-query`, or
   should the safe path be stubbed for the first demo?
