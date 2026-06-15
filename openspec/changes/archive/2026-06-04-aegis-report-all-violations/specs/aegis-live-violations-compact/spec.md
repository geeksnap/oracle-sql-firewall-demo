## MODIFIED Requirements

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
