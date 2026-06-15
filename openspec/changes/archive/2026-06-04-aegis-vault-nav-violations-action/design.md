## Context

- Nav sections: Dashboard, Threat Feed, Policy, Violations, Demo Control (`sidebar-types.ts`).
- Center column renders `PolicyPanel` when `section === "policy"`.
- Right rail already shows `MonitoredAppsPanel` + `PolicyPanel` + live violations snippet.
- `ViolationsTable` columns: Time, Source App, User, **Type** (currently maps `cause` or `firewall_action` interchangeably in `mapViolationRow`).
- Oracle `DBA_SQL_FIREWALL_VIOLATIONS.FIREWALL_ACTION` is `VARCHAR2(7)` — documented example: **BLOCKED**; log-only enforcement typically yields a non-block action (e.g. **LOGGED** / allow-with-log — normalize in mapper).

## Goals / Non-Goals

**Goals:**

- Remove **Policy** from Command NAV and main content area.
- Show **Action** on Threat Feed and full Violations pages (and optionally dashboard “Latest Threats” for consistency).
- Clear separation: **Type** = `CAUSE` (SQL violation, context violation, …); **Action** = firewall enforcement outcome.

**Non-Goals:**

- Changing Demo Control or database package.
- Removing right-rail posture panels (unless redundant—keep `MonitoredAppsPanel`; drop duplicate center Policy only).

## Decisions

### 1. Policy page removal

- Delete `policy` from `NavSection` and `Sidebar` items.
- Remove `section === "policy"` branch in `page.tsx`.
- If user had Policy selected (bookmark), default redirect not needed (client state only).
- **Right rail:** Keep `PolicyPanel` on desktop right rail OR remove if duplicate—**keep** for now (user asked only to remove Policy **page** from nav).

### 2. Action column mapping

Add `mapViolationActionLabel(firewallAction: string | undefined, cause?: string): string`:

| `FIREWALL_ACTION` (normalized) | Display label |
|-------------------------------|---------------|
| `BLOCK`, `BLOCKED`, `Y`, `TRUE` | **Blocked** |
| `LOG`, `LOGGED`, `ALLOW`, `PASSED`, `N`, `FALSE` | **Logged without Block** |
| empty / unknown | **Unknown** or derive from `CAUSE` if action empty |

Export helper from `queries.ts` for tests. Store on violation:

```typescript
firewall_action?: string;  // raw Oracle value
action_label: string;      // UI column
violation_type: string;    // CAUSE only (rename clarity optional; keep field name)
```

Update `mapViolationRow` to set `violation_type` from **CAUSE** only; `action_label` from **FIREWALL_ACTION**.

### 3. ViolationsTable UI

- Insert **Action** column after **Type** (or before SQL): `Time | Source App | User | Type | Action | SQL`.
- Style: **Blocked** → alert red; **Logged without Block** → amber; unknown → slate.
- Update `colSpan` for empty state.
- Props: `showAction?: boolean` default `true` for Threat Feed and Violations; dashboard “Latest Threats” and right-rail “Live Violations” also `true` for consistency.

### 4. No API contract break

Socket events reuse `FirewallViolation` shape; clients get new fields automatically.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Oracle action strings vary by version | Normalize uppercase; document in mapper; fall back to raw value in tooltip optional |
| Type column empty if only action was populated before | Fix mapper to use CAUSE for Type |
| Right rail still has Policy panel | Acceptable; nav simplified |

## Migration Plan

Deploy aegis-vault only; no DB migration.

## Open Questions

- None. If `FIREWALL_ACTION` values on 26ai differ, adjust mapper after one live violation sample.
