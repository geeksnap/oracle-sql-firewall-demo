# aegis-live-violations-compact Specification

## Purpose
Right-rail **Live Violations** compact table on the Aegis Vault Dashboard — three columns, full ledger, no User column in the aside.
## Requirements
### Requirement: Right-rail Live Violations uses a compact three-column layout

The Aegis Vault right aside SHALL render the **Live Violations** panel with exactly three table columns: **Time**, **Source App**, and **Type**. The panel SHALL NOT display **User**, Action, or SQL columns in that location (Oracle `username` is not shown in the compact table). The panel SHALL list **all** violations in the current ledger (same set as Latest Threats, up to `METRICS_VIOLATION_LIMIT`) with internal scroll — not a twelve-row subset.

#### Scenario: Live Violations shows three columns on desktop

- **WHEN** the dashboard is viewed at the large breakpoint with the right aside visible
- **THEN** the **Live Violations** table header shows only Time, Source App, and Type

#### Scenario: Live Violations rows omit hidden fields

- **WHEN** violation rows are listed in the right-rail **Live Violations** panel
- **THEN** each row shows formatted time, source app label, and violation type only

#### Scenario: Compact layout fits the right rail

- **WHEN** the **Live Violations** panel is rendered with `variant="compact"`
- **THEN** the table scrolls within the panel and does not require horizontal scrolling at the default right-rail width (~340px)

#### Scenario: Live Violations matches full ledger

- **WHEN** the server ledger contains more than twelve violations
- **THEN** Live Violations SHALL show every ledger row (up to `METRICS_VIOLATION_LIMIT`), including duplicate occurrences of the same attack

#### Scenario: User column absent

- **WHEN** the user views Live Violations on the Dashboard
- **THEN** the table SHALL NOT include a **User** column or username cells

### Requirement: Full violation detail remains on main views

Threat Feed, Violations (nav), and other non-compact `ViolationsTable` instances SHALL retain the full column layout including User, Action, and SQL unless explicitly configured otherwise.

#### Scenario: Threat Feed keeps full columns
- **WHEN** the presenter opens **Threat Feed**
- **THEN** the violations table includes columns beyond Time, Source App, and Type (e.g. User, Action, SQL)

#### Scenario: All Violations keeps full columns
- **WHEN** the presenter opens **Violations** in the sidebar
- **THEN** the violations table includes columns beyond Time, Source App, and Type

