## Context

Aegis Vault uses a three-column `lg` grid (`220px | 1fr | 340px`) with `min-h-[calc(100vh-8rem)]` on the main row. Violation tables use `flex-1 overflow-auto` on the scroll container, but parent flex chains do not always cap height — so **Latest Threats** and **Live Violations** can push the page taller as rows accumulate. Break-Glass Control lacks the same `min-h-0` flex discipline as Dashboard, and the demo-control output console grows without a bounded parent, causing perceived width/height jitter.

Transaction re-seeding today requires running `luminaforge/scripts/reset-demo-data.sql` manually (full script also resets user roles). Presenters need a Break-Glass button scoped to **transactions only** for Attack Point 2 rehearsal loops.

## Goals / Non-Goals

**Goals:**

- Fixed viewport shell: app frame does not grow with violation count or demo output lines.
- Scroll inside violation panels only; header, sidebar, metrics, and globe positions remain stable.
- Break-Glass and Dashboard share the same outer dimensions at `lg` breakpoint.
- One-click transaction re-seed from §3.3 Firewall setup with console feedback.

**Non-Goals:**

- Full `reset-demo-data.sql` (user role restoration, portfolio, luxury_items) — only `transactions` table baseline.
- Mobile layout redesign below `lg`.
- Changing violation ledger limit (`METRICS_VIOLATION_LIMIT` / 200 rows).

## Decisions

### 1. Viewport shell: `h-screen overflow-hidden` on root layout

Wrap the dashboard grid in a fixed-height container (`h-screen` or `h-[100dvh]`) with `overflow-hidden`. The inner three-column row gets a computed fixed height (e.g. `h-[calc(100dvh-theme(spacing.header))]`) and `min-h-0` on all flex children. **Rationale:** prevents document body scroll from growing; all scrolling happens inside designated panels.

**Alternative considered:** `max-h` only on violation tables — rejected because Break-Glass and right-rail panels still jitter without a capped ancestor.

### 2. Latest Threats + Live Violations: explicit `max-h` + `overflow-y-auto`

Assign each violation panel a fixed flex share of the center/right column (existing Dashboard split preserved: table ~2/3, Full SQL ~1/3). Table body wrapper uses `overflow-y-auto` with `min-h-0`. **Rationale:** matches presenter expectation of a SOC ticker, not an infinitely growing list.

### 3. Break-Glass width: match Dashboard grid constraints

Apply the same `min-h-0 flex-1 flex-col` wrapper to Break-Glass content as Dashboard. Demo output console keeps its existing ~15-row internal scroll but sits inside a flex child with `min-h-0` so it cannot expand the center column width. **Rationale:** addresses inconsistent width when output grows.

### 4. Transaction reset: new `aegis_demo_control` procedure

Add `reinit_default_transaction_data(p_msg OUT VARCHAR2)` to `SYS.aegis_demo_control` that:

1. `DELETE FROM luminaforge.transactions WHERE type = 'BULK'` (Point 4 artifacts)
2. Re-run the transaction re-seed block from `reset-demo-data.sql` (delete + insert for `user_id IN (3,4,5,8,9)` and asset backfill for `user_id = 1`)

Expose as luminaforge-scoped demo action `reinit-default-transaction-data` via existing `POST /api/demo-control/execute`. Button label: **Reinitialize default transaction data** in `LuminaforgeFirewallControlCenter` §3.3.

**Alternative considered:** HTTP call to a new LuminaForge API — rejected; Break-Glass actions consistently go through `aegis_demo_control` and AEGIS_APP connection.

**Alternative considered:** Run full `reset-demo-data.sql` — rejected; user asked for transaction data only; role reset is Point 4 concern.

### 5. Package version bump

Increment `c_package_version` in `Oracle_DB_Demo_Control_Grant.sql` and `aegis-vault/build-info.json` (patch bump, e.g. `2.9.0` → `2.10.0`).

## Risks / Trade-offs

- **[Risk] Fixed viewport clips content on very short screens** → Mitigation: keep internal panel scroll; optional `min-h` fallback at `md` only.
- **[Risk] Procedure drift from `reset-demo-data.sql`** → Mitigation: extract shared SQL into `sql/luminaforge_reinit_transactions.sql` included by both scripts.
- **[Risk] Presenters expect user-role reset too** → Mitigation: button label explicitly says "transaction data"; document in console output.

## Migration Plan

1. Deploy updated `Oracle_DB_Demo_Control_Grant.sql` as SYS on demo PDB.
2. Deploy Aegis Vault app code.
3. Verify Break-Glass button restores `/transactions` benign + cross-client demo rows.

## Open Questions

- None — scope is UI layout + one whitelisted PL/SQL procedure.
