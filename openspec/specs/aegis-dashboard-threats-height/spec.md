# aegis-dashboard-threats-height Specification

## Purpose
TBD - created by archiving change aegis-dashboard-threats-height. Update Purpose after archive.
## Requirements
### Requirement: Dashboard Latest Threats block fills half the center column to Command Nav baseline
On the Dashboard, the combined **Latest Threats** table and **Full SQL** panel SHALL occupy approximately half of the center column height and SHALL extend downward to align with the bottom of the **Command Nav** sidebar column on large (`lg`) layouts.

#### Scenario: Large viewport layout
- **WHEN** the user views the Dashboard on a large screen
- **THEN** the center column SHALL stretch to the same row height as the Command Nav sidebar
- **AND** the Latest Threats + Full SQL block SHALL use at least 50% of the center column height below the metrics and globe
- **AND** the bottom of the Latest Threats block SHALL align with the bottom of the Command Nav panel

### Requirement: Latest Threats shows more rows with internal scroll

The Latest Threats table SHALL display **all** violations in the current server ledger (up to `METRICS_VIOLATION_LIMIT`), not a fixed twelve-row cap. The table body SHALL scroll inside the enlarged panel when content exceeds the visible area.

#### Scenario: More rows visible

- **WHEN** more than twelve violations exist in the ledger
- **THEN** the Dashboard SHALL pass the full ledger to the Latest Threats table (bounded by `METRICS_VIOLATION_LIMIT`)
- **AND** the table body SHALL scroll inside the enlarged panel without growing the page layout

#### Scenario: Repeated triggers all listed

- **WHEN** multiple violations are recorded for the same attack during a demo session
- **THEN** Latest Threats SHALL list each reported occurrence (no deduplication by SQL skeleton or prior poll)

### Requirement: Full SQL detail behavior preserved in enlarged block
Within the enlarged Dashboard block, the internal split SHALL remain approximately two-thirds table and one-third **Full SQL**, with row selection showing the full `sql_text` unchanged.

#### Scenario: Row selection in tall Dashboard block
- **WHEN** the user clicks a row in Latest Threats on the Dashboard
- **THEN** the row SHALL highlight
- **AND** the Full SQL panel SHALL show the complete SQL for that row

### Requirement: Latest Threats omits User column

The Latest Threats table on the Dashboard SHALL NOT display a **User** column. Presenters SHALL see Time, Source App, Type, Action, and row selection for Full SQL without the Oracle username field.

#### Scenario: Latest Threats table headers

- **WHEN** the user views Latest Threats on the Dashboard
- **THEN** the table header SHALL NOT include **User**
- **AND** rows SHALL NOT show `username` in a dedicated column

