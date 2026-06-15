## Context

`aegis-vault-soc-ui-refresh` added firewall control labels via `mapFirewallControlLabel()` and a tone-based pill (`protect` | `warn` | `off` | `unknown`). Demo Control inactive state still uses `text-slate-400`. Presenters want stronger, state-specific defence visuals in Monitored Apps.

## Goals / Non-Goals

**Goals:**

- Demo Control nav label always reads **dark red** (e.g. `#fca5a5` / `#991b1b` border) when inactive and brighter when active.
- Each Monitored App card **highlights defence status** with distinct pill + card border/background per the five labels above.
- Violation **alert** styling (red card) still applies when `has_alert`, but defence pill keeps correct label/color.

**Non-Goals:**

- Changing label text or Oracle mapping logic (unless adding `defence_status` key only).
- Demo Control panel button layout changes.
- LuminaForge app build.

## Decisions

### 1. Demo Control inactive styling

**Decision:** Inactive Demo Control button classes:

```
border-[#7f1d1d]/35 bg-[#7f1d1d]/8 text-[#fca5a5]
hover:border-[#991b1b]/50 hover:bg-[#7f1d1d]/15 hover:text-[#fecaca]
```

Active state keeps existing stronger red glow. **Never** use `text-slate-400` on Demo Control.

### 2. Defence status key

**Decision:** Add `FirewallDefenceStatus` union and `defence_status` on `MonitoredAppStatus`:

`'enforced-block' | 'enforced-log' | 'allow-list-off' | 'firewall-off' | 'not-configured'`

Set in `mapFirewallControlLabel()` return value alongside `label` and `tone`.

**Rationale:** UI styles keyed on stable enum; labels remain presenter-facing strings.

### 3. Per-state highlight map

**Decision:** `DEFENCE_HIGHLIGHT` in `MonitoredAppsPanel.tsx` (or `lib/defence-styles.ts`):

| `defence_status` | Pill | Card accent (when no violation alert) |
|------------------|------|--------------------------------------|
| `enforced-block` | green glow, bold | `border-[#00ff9f]/40 bg-[#00ff9f]/8` |
| `enforced-log` | amber | `border-[#fbbf24]/35 bg-[#fbbf24]/8` |
| `allow-list-off` | orange-muted | `border-[#fb923c]/30 bg-[#fb923c]/5` |
| `firewall-off` | dark red | `border-[#991b1b]/40 bg-[#7f1d1d]/10` |
| `not-configured` | slate dashed border pill | `border-slate-600/40 bg-slate-800/20` |

When `has_alert`, card uses alert border/background; pill still uses defence styles (optionally ring).

### 4. Defence status subheading

**Decision:** Add small label above pill area: **Defence status** (10px uppercase) so presenters connect pill to SQL Firewall posture.

## Risks / Trade-offs

- **[Risk] Long pill text wraps** → `max-w-[150px]`, `leading-tight`, `text-[9px]`.
- **[Risk] AEGIS_APP shows NOT CONFIGURED** (allow-list disabled for SOC user) — correct per DB; document in demo script.

## Migration Plan

1. Ship UI-only diff; restart `npm run dev`.
2. Toggle Demo Control states in SQL Developer to verify each pill/card highlight.

## Open Questions

- None.
