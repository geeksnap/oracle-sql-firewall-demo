## Context

Aegis Vault (`aegis-vault/`) is a Next.js SOC dashboard. **Demo Control** (`DemoControlPanel.tsx`) renders three stacked sections: global firewall, AEGIS_APP (view-only), and LuminaForge. Each section currently uses `grid md:grid-cols-3` with labeled columns **Protect | View | Risk**, which makes cards tall and puts **Protect** on the left.

The main layout (`page.tsx`) uses a three-column grid: sidebar, center content, right rail (`MonitoredAppsPanel` + `ViolationsTable`). **PolicyPanel** appears on the `policy` nav route and on the removed `monitored-apps` route as a two-column page.

Constraints: UI-only change; preserve existing Demo Control actions, scopes, and ORA-47605 guardrails for AEGIS_APP.

## Goals / Non-Goals

**Goals:**

- Section cards with a **header row**: title/subtitle left, **Protect** button(s) right (sections 1 and 3 only).
- **Body row**: `grid-cols-3` — View buttons in columns 1–2, Risk buttons in column 3.
- Shorter section cards (tighter `p-3`, smaller gaps, drop per-section footer on LuminaForge).
- Right rail: `MonitoredAppsPanel` then `PolicyPanel` then `ViolationsTable`.
- Remove `monitored-apps` from `NavSection` and sidebar.

**Non-Goals:**

- New demo actions, DB package changes, or socket protocol changes.
- Removing the standalone **Policy** center-page (can stay for full-width policy review).
- Mobile-specific redesign beyond existing responsive stacking.

## Decisions

### 1. `DemoControlSection` layout component

Extract a shared layout wrapper used by global, Aegis, and LuminaForge sections:

```
┌─────────────────────────────────────────────────────────┐
│ Title + subtitle (left)          [Protect btn(s)] (right)│  ← only if protect slot set
├──────────────┬──────────────┬──────────────────────────┤
│ View col 1   │ View col 2   │ Risk column              │
│ (blue btns)  │ (blue btns)  │ (red btns)               │
└──────────────┴──────────────┴──────────────────────────┘
```

- **Global:** Protect = “Firewall on globally”. View left = “View violations (all)”. View middle = empty. Risk = “Firewall off globally”, “Clear all violation logs”.
- **LuminaForge:** Protect = “Block attacks”. View left = “Allow attacks, still log”, “View in DB (violations)”. View middle = “View allow-list status”, “View capture status”. Risk = “Stop allow-list enforcement”, “Clear violation logs”.
- **Aegis:** No protect slot. View left = “View violations”, “View allow-list status”. View middle = “View capture status”. Risk = “Clear violation logs”.

**Rationale:** Matches presenter directive (protect top-right; view split left/middle; risk right) without changing action wiring.

**Alternative considered:** Keep 3-column Protect|View|Risk — rejected (user explicitly requested protect in header).

### 2. Compact styling

- Section padding `p-4` → `p-3`; gap `gap-3` → `gap-2`.
- Subtitle one line or shortened; remove LuminaForge footnote (“View in app: open Threat Feed…”).
- Optional `compact` prop on `DemoControlButton` (`py-2 text-xs`) if buttons still feel tall.

### 3. Right rail policy stack

In `page.tsx` right `<aside>`:

```tsx
<MonitoredAppsPanel apps={apps} />
<PolicyPanel policies={policies} />
<ViolationsTable ... />
```

Remove `section === "monitored-apps"` branch and `monitored-apps` from `PRIMARY_NAV` / `NavSection`.

**Rationale:** Policy context always visible next to monitored apps during demos; eliminates redundant nav item.

### 4. Deep-link / stale state

If user had `monitored-apps` bookmarked, default `useState` remains `"dashboard"` — no migration needed. Remove type union member to catch compile-time references.

## Risks / Trade-offs

- **[Risk] Right rail becomes tall on small laptops** → Mitigation: `PolicyPanel` and violations table already scroll within page; optional `max-h` on policy list in follow-up.
- **[Risk] Empty middle column on global section** → Mitigation: acceptable; or center a single view button visually spanning cols 1–2 with `col-span-2` if design prefers—spec allows empty middle.
- **[Risk] LuminaForge view button count (4) uneven across two columns** → Mitigation: split 2+2 as listed above.

## Migration Plan

1. Implement layout component and refactor `DemoControlPanel`.
2. Update `page.tsx` right rail and remove monitored-apps route.
3. Update `Sidebar.tsx` / `sidebar-types.ts`.
4. Manual verify: Demo Control all buttons still fire; right rail shows policy; nav has no Monitored Apps.

## Open Questions

- None blocking apply; optional follow-up: remove redundant center **Policy** nav if presenters only use right rail.
