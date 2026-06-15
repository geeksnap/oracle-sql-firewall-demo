## Why

Aegis Vault (the SOC defense dashboard) is already built and continuously polls
`SYS.DBA_SQL_FIREWALL_VIOLATIONS` for both `AEGIS_APP` and `luminaforge`, but it
has nothing realistic to monitor: the `luminaforge` schema exists in PDB
`AHDB2605_PDB1` with seeded data, yet no application drives traffic against it.

To make the Oracle 26ai SQL Firewall demo land, we need a **beautiful, innocent
looking B2C wealth/marketplace app** ("LuminaForge") whose everyday-looking
inputs are secretly the 4 attack vectors. A presenter types a normal-seeming
value into a luxury fintech UI, the vulnerable backend rawly concatenates it into
Oracle SQL, the Firewall kernel logs (or blocks) the anomaly, and Aegis Vault
lights up in real time. The "wow" depends on the attacks being **camouflaged**:
no `<input placeholder="SQL injection here">` — they must look like product
features a real fintech would ship.

## What Changes

- **New standalone Next.js 15 app at `./luminaforge`** (independent `.env`, own
  port `3001`), Dark Luxury Fintech theme, connecting to Oracle as the
  `luminaforge` DB user via `oracledb` Thin Mode.
- **4 intentionally vulnerable `/api` routes** that use raw string concatenation
  (parameterized binds deliberately avoided) so each is 100% reproducibly
  hackable. These are the ONLY vulnerable routes; everything else is safe.
- **4 camouflaged UI surfaces**, each mapped to one Firewall attack class:
  1. **Market Explorer Search** — "Lux-Asset / Ticker Universal Search Bar" in
     the top nav → boolean `' OR '1'='1` bypass leaking hidden `luxury_items`.
  2. **Transaction History Filter** — "Transaction Memo / Reference ID Filter"
     in the advanced-search drawer → conditional injection leaking other users'
     `transactions`.
  3. **Custom Statement Generator** — "Tax Institution ID" field on the tax-doc
     download page → `UNION SELECT` leaking `users.username` /
     `users.password` / `users.role` credentials (incl. seeded `admin`) onto
     the formatted statement grid.
  4. **Quick Bulk Action Memo** — "Batch Execution Note" textarea during bulk
     asset transfers → stacked `;` query running a second destructive command.
- **Safe path preserved**: the floating "Lumina AI Wealth Assistant"
  (`/api/ai-query`) routes through the Oracle SQLcl MCP server and is NOT
  vulnerable — it demonstrates the contrast between safe and unsafe access.
- **One additive schema change**: `users` gains a `password VARCHAR2(100)`
  column (plus a seeded `admin` row) so Point 3 leaks real **username +
  password** credentials. `Oracle_DB_Setup.sql` is updated accordingly and must
  be re-deployed (cleanup + re-run). All other tables (`portfolio`,
  `transactions`, `luxury_items`) are unchanged from the verified deployment.

## Capabilities

### New Capabilities

- `luminaforge-attack-surface`: The 4 camouflaged vulnerable UI inputs, their
  vulnerable API contracts, the exact raw-concatenation query shapes, the
  expected leak/effect of each demo payload, and the safe (MCP) AI path that
  must remain non-vulnerable.
- `luminaforge-app-shell`: The LuminaForge Next.js 15 App Router shell — Dark
  Luxury design system, navigation, screens (Dashboard / Market Explorer /
  Transaction History / Custom Statement / Bulk Action), DB connection layer to
  the `luminaforge` user, and independent `.env` / port routing that
  complements (does not collide with) Aegis Vault.

### Modified Capabilities

- _(none under `openspec/specs/`)_ — Aegis Vault already consumes
  `DBA_SQL_FIREWALL_VIOLATIONS` generically; no Aegis spec requirement changes.
  LuminaForge traffic appears automatically once the app drives queries.

## Impact

- **New app dir `./luminaforge/`**: Next.js 15 App Router source, vulnerable +
  safe API routes, DB pool to `luminaforge` user, UI components, `.env` (port
  `3001`, `DB_USER=luminaforge`).
- **Oracle DB schema**: additive `users.password` column + seeded `admin` row in
  `Oracle_DB_Setup.sql` (re-deploy required); no other table changed.
- **Oracle DB**: read/write against `luminaforge` schema only; relies on the
  existing Firewall capture (`CREATE_CAPTURE('luminaforge', ...)`) and the
  `SYS.DBMS_SQL_FIREWALL` enablement already run per the log. The stacked-query
  attack (Point 4) performs real INSERT/UPDATE against `luminaforge` tables — a
  reset/reseed script is required for repeatable demos.
- **Aegis Vault**: no code change; benefits from live `luminaforge` violations
  flowing into its existing WebSocket broadcast and 3D globe alert.
- **Security note**: this app is **intentionally insecure by design for a
  controlled demo**. The 4 vulnerable routes must never ship to production and
  must be clearly fenced/annotated as deliberate.
