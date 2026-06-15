## Why

The right-rail **Live Violations** panel is narrow (~340px) and currently shows six columns (Time, Source App, User, Type, Action, SQL), forcing horizontal scroll and burying the signal presenters care about during a demo. A compact three-column layout—**Time**, **Source App**, **Type**—keeps the feed readable at a glance while full detail remains on **Threat Feed** and **Violations** main views.

## What Changes

- **Right rail only:** The `ViolationsTable` titled **Live Violations** in the desktop right aside SHALL display exactly three columns: **Time**, **Source App**, **Type**.
- **Hide on compact view:** User, Action, and SQL columns SHALL NOT appear in the right-rail instance.
- **Other views unchanged:** Dashboard “Latest Threats”, center **Threat Feed**, and **Violations** pages keep the existing full column set (including User, Action, SQL where already enabled).
- **`ViolationsTable` API:** Add a `variant` (or equivalent) prop—e.g. `compact` vs `full`—so column layout is explicit and not inferred from `title`.

## Capabilities

### New Capabilities

- `aegis-live-violations-compact`: Compact three-column layout for the right-rail Live Violations panel.

### Modified Capabilities

- _(none under `openspec/specs/`)_

## Impact

- **aegis-vault/**: `ViolationsTable.tsx`, `page.tsx` (right-rail `ViolationsTable` usage)
- **Optional:** `SPEC-aegis.md` one-line note on right-rail columns
- **No backend / WebSocket / Oracle changes**
