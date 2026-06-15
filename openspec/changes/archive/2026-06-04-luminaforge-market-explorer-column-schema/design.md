## Context

Attack Point 1 chain today:

| Step | Payload (summary) | Leak |
|------|-------------------|------|
| 1 | `' OR '1'='1` | All `luxury_items` |
| 2 | `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --` | Table names |
| 3 | *(new)* | Column names + types for one table |

Vulnerable SQL remains:

```sql
SELECT id, name, price, category
FROM luxury_items
WHERE name LIKE '%<input>%'
```

Step 3 closes the `LIKE` clause and unions from `user_tab_columns` with `AND 1=0` on the first arm to avoid mixing luxury rows (same pattern as optional cleanup in step 2 UI filter).

## Goals / Non-Goals

**Goals:**

- Step-3 payload leaks `column_name` and `data_type` for a chosen table (default demo: `USERS`).
- Grid shows `COLUMNS` badge; primary label `column_name · data_type` (e.g. `PASSWORD · VARCHAR2`).
- Presenter can click a step-2 `SCHEMA` card to pre-fill step-3 payload for that table.
- Three hints visible on `/market` documenting the full ladder.

**Non-Goals:**

- Blind table-name brute force UI (presenter copies from step 2).
- `all_tab_columns` / cross-schema enumeration.
- Changing concat to bind variables.

## Decisions

### 1. Step-3 UNION payload

**Chosen:**

```text
' AND 1=0 UNION SELECT ROWNUM, column_name || ' · ' || data_type, 0, 'COLUMNS' FROM user_tab_columns WHERE table_name = 'USERS' --
```

- `AND 1=0` suppresses the `luxury_items` arm.
- `category = 'COLUMNS'` tags rows for UI (parallel to `SCHEMA`).
- Presenter replaces `USERS` with any table from step 2 (`TRANSACTIONS`, etc.).

**Verified** on Demo DB 26ai: returns `ID`, `USERNAME`, `ROLE`, `PASSWORD` with types.

### 2. UI pivot from step 2

**Chosen:** Clicking a `SCHEMA` result card sets the search input to the step-3 payload with that `table_name` (uppercase Oracle identifier). Presenter still clicks Search to fire the injection (preserves 60s cooldown behavior).

**Alternative:** Auto-search on click — rejected to avoid duplicate Firewall violations.

### 3. Results display

**Chosen:** When any row has `category === 'COLUMNS'`, show column leak banner and filter grid to `COLUMNS` rows only (same pattern as step-2 `SCHEMA` filter).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Wrong `table_name` in payload → 0 rows | Document `USERS` default; click-to-pivot from step 2 |
| Single-quote in table name breaks SQL | Demo tables use simple identifiers; no user-supplied table editor |
| Firewall blocks step 3 | Same training/allow-list guidance as steps 1–2 |

## Migration Plan

UI + docs only. No reset script changes.

## Open Questions

None.
