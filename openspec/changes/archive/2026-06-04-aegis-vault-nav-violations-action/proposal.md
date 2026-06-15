## Why

The SOC sidebar has a dedicated **Policy** page that duplicates posture already shown in **Monitored Apps** (right rail). Presenters need a simpler nav. Threat Feed and Violations tables also omit whether SQL Firewall **blocked** the statement or only **logged** it—critical for the LuminaForge demo story (log-only vs block-on).

## What Changes

- **Command NAV:** Remove **Policy** from the left sidebar; remove the center **Policy** route/view.
- **Right rail:** Keep **Monitored Apps** as the policy posture surface (existing `PolicyPanel` may remain on the right rail only, or be folded into Monitored Apps—see design).
- **Threat Feed & Violations tables:** Add an **Action** column with human-readable labels derived from `DBA_SQL_FIREWALL_VIOLATIONS.FIREWALL_ACTION` (and related fields), e.g. **Blocked**, **Logged without Block**, or other Oracle-reported status.
- **Data layer:** Extend `FirewallViolation` with `firewall_action` (raw) and `action_label` (display); map in `queries.ts`; keep **Type** column as violation **cause** (`CAUSE`).

## Capabilities

### New Capabilities

- `aegis-vault-nav-violations-action`: Sidebar nav trim, violation action column on Threat Feed and Violations views.

### Modified Capabilities

- _(none under `openspec/specs/`)_

## Impact

- **aegis-vault/**: `Sidebar.tsx`, `sidebar-types.ts`, `page.tsx`, `ViolationsTable.tsx`, `lib/types.ts`, `lib/db/queries.ts`
- **Optional:** `PolicyPanel.tsx` usage only on right rail (no nav entry)
- **SPEC-aegis.md** (optional doc sync)
