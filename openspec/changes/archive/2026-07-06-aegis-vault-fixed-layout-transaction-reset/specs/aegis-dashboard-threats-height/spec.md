## MODIFIED Requirements

### Requirement: Dashboard Latest Threats block fills half the center column to Command Nav baseline

On the Dashboard, the combined **Latest Threats** table and **Full SQL** panel SHALL occupy a **fixed** share of the center column height (approximately half below metrics and globe) and SHALL extend downward to align with the bottom of the **Command Nav** sidebar column on large (`lg`) layouts. The block SHALL NOT increase the page or center-column height when additional violations arrive.

#### Scenario: Large viewport layout

- **WHEN** the user views the Dashboard on a large screen
- **THEN** the center column SHALL stretch to the same row height as the Command Nav sidebar
- **AND** the Latest Threats + Full SQL block SHALL use a fixed allocated height below the metrics and globe
- **AND** the bottom of the Latest Threats block SHALL align with the bottom of the Command Nav panel

### Requirement: Latest Threats shows more rows with internal scroll

The Latest Threats table SHALL display **all** violations in the current server ledger (up to `METRICS_VIOLATION_LIMIT`), not a fixed twelve-row cap. The table body SHALL scroll inside the enlarged panel when content exceeds the visible area. The panel outer height SHALL remain constant regardless of row count.

#### Scenario: More rows visible

- **WHEN** more than twelve violations exist in the ledger
- **THEN** the Dashboard SHALL pass the full ledger to the Latest Threats table (bounded by `METRICS_VIOLATION_LIMIT`)
- **AND** the table body SHALL scroll inside the enlarged panel without growing the page layout

#### Scenario: Repeated triggers all listed

- **WHEN** multiple violations are recorded for the same attack during a demo session
- **THEN** Latest Threats SHALL list each reported occurrence (no deduplication by SQL skeleton or prior poll)
- **AND** the Latest Threats container height SHALL NOT increase as new rows append
