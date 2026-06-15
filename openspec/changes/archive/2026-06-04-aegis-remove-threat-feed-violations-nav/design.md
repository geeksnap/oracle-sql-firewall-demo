## Context

Aegis Vault uses a left **Command Nav** (`Sidebar.tsx`) with `NavSection` values routed in `page.tsx`. **Threat Feed** (`ThreatFeedPanel` + `ViolationsWithFullSql`) and **Violations** (full `ViolationsTable`) are separate center-column views. The Dashboard already embeds Latest Threats with Full SQL; the right rail shows compact Live Violations. Presenters rarely use the removed tabs during Oracle SQL Firewall demos.

## Goals / Non-Goals

**Goals:**

- Command Nav shows only **Dashboard** (primary) and **Break-Glass Control** (bottom).
- Default/active section remains `dashboard`; no dead nav state for removed ids.
- Preserve WebSocket violation feed, globe alerts, metrics, and right-rail Live Violations.
- Update canonical `SPEC-aegis.md` to match.

**Non-Goals:**

- Changing Latest Threats layout, row count, or Full SQL behavior on Dashboard.
- Removing `GET /api/violations` or poller/socket logic.
- LuminaForge or database changes.

## Decisions

1. **Remove nav ids from type union** — Delete `threat-feed` and `violations` from `NavSection` so TypeScript catches stale references instead of leaving unreachable branches.

2. **Delete dedicated section components from routing** — Remove `ThreatFeedPanel` usage from `page.tsx`; delete `ThreatFeedPanel.tsx` if unused. Do not keep hidden routes.

3. **Keep `ViolationsTable` and `ViolationsWithFullSql`** — Still used by Dashboard (`LatestThreatsPanel`) and right-rail compact table.

4. **No URL/deep-link migration** — App is section-state only (no Next.js routes per section); no redirects needed.

5. **SPEC + OpenSpec delta** — Update `SPEC-aegis.md` §3 in implementation tasks; delta spec documents REMOVED threat-feed nav requirements under `aegis-threat-feed-full-sql` and ADDED simplified nav under `aegis-command-nav`.

## Risks / Trade-offs

- **[Risk]** Users who relied on full-page Violations lose that view → **Mitigation**: Dashboard Latest Threats (12 rows + Full SQL) and right-rail remain; document in SPEC.
- **[Risk]** Orphan imports after deletion → **Mitigation**: `npm run build` in aegis-vault as verification task.

## Migration Plan

1. Ship UI + type changes in one PR.
2. No database or env migration.
3. Rollback: restore `PRIMARY_NAV` entries and `page.tsx` section branches from git.

## Open Questions

- None — scope is limited to nav and shell routing.
