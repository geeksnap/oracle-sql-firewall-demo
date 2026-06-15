## Context

Market Explorer (`/market`) posts to `POST /api/market/search`, which calls `searchLuxuryItems()` with raw concatenation into:

```sql
SELECT id, name, price, category
FROM luxury_items
WHERE name LIKE '%<user input>%'
```

Attack Point 1 already supports boolean bypass (`' OR '1'='1`). The results grid maps `name`, `price`, and `category` to luxury asset cards. Oracle `user_tables` is readable by `luminaforge` and exposes application table names (`USERS`, `TRANSACTIONS`, `LUXURY_ITEMS`, `PORTFOLIO`, etc.)—ideal for a reconnaissance demo before Points 2–3.

## Goals / Non-Goals

**Goals:**

- Add a canonical **UNION** payload that lists `table_name` values from `user_tables` in the same 4-column result shape as `luxury_items`.
- Present leaked rows clearly in the Market Explorer grid (table name as title, `SCHEMA` category badge, no misleading dollar price).
- Document both Attack Point 1 payloads (boolean bypass + schema discovery) in UI hint, README, and app spec.
- Log anomalous SQL to `DBA_SQL_FIREWALL_VIOLATIONS` (existing Firewall behavior; no backend change required beyond injection succeeding).

**Non-Goals:**

- Changing the vulnerable SQL builder (still single concat; no bind variables).
- Column-level enumeration (`user_tab_columns`) or cross-schema `all_tables` (can be a future presenter ad-lib).
- New API routes or Thick Mode / Instant Client dependencies.

## Decisions

### 1. UNION payload shape

**Chosen:** `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --`

- Closes the `LIKE` clause, unions four columns matching `id`, `name`, `price`, `category`.
- `ROWNUM` satisfies numeric `id`; `0` satisfies `price`; literal `'SCHEMA'` tags rows for UI detection.
- Restricts to current schema via `user_tables` (no `owner` filter needed).

**Alternatives considered:**

- `' OR '1'='1` only — already supported; does not show table names.
- `all_tables` with `owner = 'LUMINAFORGE'` — more verbose payload; unnecessary for demo PDB.
- Separate “Schema” tab — extra UI scope; rejected in favor of one search bar, two payloads.

### 2. UI detection

**Chosen:** Treat any row with `category` / `CATEGORY` equal to `SCHEMA` as a schema-discovery row.

- Render table name from `name` / `NAME`.
- Show em dash or “—” for price instead of `$0`.
- Optional banner when any schema row present: “Schema metadata exposed via UNION injection” (mirrors Tax Statement leak banner).

**Alternatives:** Heuristic on `price === 0` — too ambiguous with real luxury items.

### 3. Demo hints

**Chosen:** Two-line mono hint under search input:

1. Boolean: `' OR '1'='1`
2. Schema: `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --`

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Oracle rejects UNION if column types diverge on some PDBs | Test on Demo DB 26ai; document payload in README |
| Firewall blocks UNION before grid renders | Presenter uses training mode / allow-list; same as other attack points |
| Too many `user_tables` rows clutter grid | Acceptable for demo; optional `WHERE ROWNUM <= 15` in ad-lib only |

## Migration Plan

1. Ship UI + docs only (no DDL).
2. Verify with live search on `/market`; confirm Aegis violation for `luminaforge`.
3. No reset script changes required.

## Open Questions

None—ready for implementation.
