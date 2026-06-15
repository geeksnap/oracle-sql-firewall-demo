## Why

The presenter demo flow centers on the **Dashboard** (globe, metrics, Latest Threats + Full SQL) and **Break-Glass Control**. Dedicated **Threat Feed** and **Violations** Command Nav entries duplicate that surface area and add navigation clutter without improving the live demo narrative.

## What Changes

- **BREAKING**: Remove **Threat Feed** and **Violations** items from the left **Command Nav** sidebar.
- **BREAKING**: Remove center-column routes for `threat-feed` and `violations` sections from the main shell.
- Narrow `NavSection` to `dashboard` and `break-glass-control` only.
- Keep **Live Violations** (right rail, compact) and **Latest Threats** on Dashboard unchanged.
- Remove or retire unused UI modules (`ThreatFeedPanel`, full-page `ViolationsTable` route) if no longer referenced.
- Update `aegis-vault/SPEC-aegis.md` layout section to reflect the simplified nav.

## Capabilities

### New Capabilities

- `aegis-command-nav`: Command Nav exposes only Dashboard and Break-Glass Control; violation browsing is via Dashboard Latest Threats and right-rail Live Violations.

### Modified Capabilities

- `aegis-threat-feed-full-sql`: Threat Feed is no longer a navigable section (requirements superseded by removal; archive delta marks nav/section requirements removed).

## Impact

- `aegis-vault/src/components/Sidebar.tsx`, `sidebar-types.ts`
- `aegis-vault/src/app/page.tsx` (section switch, imports)
- `aegis-vault/src/components/ThreatFeedPanel.tsx` (delete or orphan cleanup)
- `aegis-vault/SPEC-aegis.md` §3 Layout
- No API or poller changes; `GET /api/violations` may remain for future use
