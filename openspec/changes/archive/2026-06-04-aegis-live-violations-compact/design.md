## Context

`ViolationsTable` is shared across Aegis Vault:

| Location | Title | Today |
|---|---|---|
| Right aside (lg+) | Live Violations | All columns, `min-w-[600px]` |
| Dashboard | Latest Threats | Subset of rows, full columns |
| Threat Feed | Threat Feed | Full + Source App |
| Violations nav | All Violations | Full columns |

The right rail is the presenter’s at-a-glance ticker; six columns overflow the ~340px column.

## Goals / Non-Goals

**Goals:**
- Right-rail **Live Violations** shows only **Time**, **Source App**, **Type**.
- Table fits the narrow aside without horizontal scroll (drop `min-w-[600px]` for compact variant).
- Source App styling preserved (`luminaforge` red, `AEGIS_APP` / `aegisvault` cyan/amber per existing rules).

**Non-Goals:**
- Changing Threat Feed or All Violations column sets.
- Changing violation data model or poll logic.
- Removing Action column from main views (still valuable for block vs log demos).

## Decisions

### Decision 1 — `variant` prop on `ViolationsTable`

```ts
type ViolationsTableVariant = "full" | "compact";

interface ViolationsTableProps {
  violations: FirewallViolation[];
  title?: string;
  variant?: ViolationsTableVariant; // default "full"
}
```

| `variant` | Columns |
|---|---|
| `compact` | Time · Source App · Type |
| `full` | Time · Source App · User · Type · Action · SQL (current defaults) |

Deprecate or ignore `showAction` / `showSourceApp` when `variant="compact"` (always show Source App in compact; never show Action/SQL/User).

### Decision 2 — Right-rail usage in `page.tsx`

```tsx
<ViolationsTable
  violations={violations.slice(0, 12)}
  title="Live Violations"
  variant="compact"
/>
```

### Decision 3 — Compact table layout

- Remove `min-w-[600px]` on compact; use `w-full` and allow text truncate on Type if needed.
- `colSpan={3}` for empty state.
- Source App cell: extend color map for future `aegisvault` (amber) when break-glass lands—same PR can add if not yet present.

### Decision 4 — Type column semantics

**Type** continues to show `violation_type` (`CAUSE` from Oracle, or `BREAK_GLASS` for synthetic break-glass rows). No rename to “Action” on compact view.

## Risks / Trade-offs

- **Less detail on right rail** → Mitigation: click **Threat Feed** / **Violations** for full row.
- **Two layout modes in one component** → Mitigation: single `variant` switch keeps JSX DRY.

## Open Questions

- Should **Latest Threats** on the dashboard also use compact? **Default: no**—only right-rail **Live Violations** per user request.
