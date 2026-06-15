## Context

Transaction History (`/transactions`) has **Institutional Transaction Lookup** (vulnerable `POST /api/transactions/filter`) and a **Ledger results** table (ID, User ID, Type, Amount, Date). The `transactions` table today has no `asset` column. Presenters need a quick benign load of demo_user (`user_id = 1`) activity for the last 30 days without typing a filter.

## Goals / Non-Goals

**Goals:**

- Button **Show all my last 30 days records** loads scoped rows into the same Ledger results table used by search.
- Ledger shows an **Asset** column (e.g. `AAPL`, `ORCL`, `GOLD`, `CASH`) for each row when data exists.
- 30-day query uses **parameterized** SQL (`user_id` + interval bind) — not part of Attack Point 2.
- Attack Point 2 vulnerable concat path unchanged; its SELECT adds `asset` to returned rows.

**Non-Goals:**

- Changing injection payloads or firewall behavior.
- Joining live portfolio prices or computing P&amp;L.
- 30-day query for other users (only demo user `user_id = 1`).

## Decisions

1. **Schema: `asset VARCHAR2(40)` on `transactions`** — Nullable for legacy rows; seed script sets symbols for all seeded INSERTs. Existing DBs: migration snippet in reset script (`UPDATE` / re-insert pattern) rather than requiring full re-run of Setup for devs who only run reset.

2. **Safe query module** — `lib/db/safe-queries.ts` with `listMyRecentTransactions(days = 30)` using binds:
   ```sql
   SELECT id, user_id, type, amount, timestamp, asset
   FROM transactions
   WHERE user_id = :userId
     AND timestamp >= SYSTIMESTAMP - NUMTODSINTERVAL(:days, 'DAY')
   ORDER BY timestamp DESC
   ```

3. **API** — `POST /api/transactions/recent` body optional `{ days?: number }` default 30; returns `{ rows }`.

4. **UI placement** — Secondary button below Search Ledger in `TransactionHistoryLookup` (outline style, not gold primary). On click: call recent API, set `searched=true`, header **Ledger results**.

5. **Asset display** — New column between Type and Amount (or after Type). Show `—` when null. Injection rows for other users may have null asset until seeds updated.

6. **Default page state** — Keep small static DEFAULT_TX for first paint optional; button replaces with live DB data.

## Risks / Trade-offs

- **[Risk]** DB without `asset` column breaks queries → **Mitigation**: document running reset script; Setup.sql updated for greenfield installs.
- **[Risk]** Confusion between safe 30d button and injection search → **Mitigation**: button label explicitly says “my last 30 days”; only returns user_id 1.

## Migration Plan

1. Update `Oracle_DB_Setup.sql` and `reset-demo-data.sql`.
2. Deploy app + run reset (or ALTER + UPDATE) on demo PDB.
3. Verify button shows ~12 rows for user 1; injection still works.

## Open Questions

- None.
