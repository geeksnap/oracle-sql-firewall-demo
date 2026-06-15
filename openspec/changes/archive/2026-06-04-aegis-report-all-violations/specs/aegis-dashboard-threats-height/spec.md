## MODIFIED Requirements

### Requirement: Latest Threats shows more rows with internal scroll

The Latest Threats table SHALL display **all** violations in the current server ledger (up to `METRICS_VIOLATION_LIMIT`), not a fixed twelve-row cap. The table body SHALL scroll inside the enlarged panel when content exceeds the visible area.

#### Scenario: More rows visible

- **WHEN** more than twelve violations exist in the ledger
- **THEN** the Dashboard SHALL pass the full ledger to the Latest Threats table (bounded by `METRICS_VIOLATION_LIMIT`)
- **AND** the table body SHALL scroll inside the enlarged panel without growing the page layout

#### Scenario: Repeated triggers all listed

- **WHEN** multiple violations are recorded for the same attack during a demo session
- **THEN** Latest Threats SHALL list each reported occurrence (no deduplication by SQL skeleton or prior poll)

## ADDED Requirements

### Requirement: Latest Threats omits User column

The Latest Threats table on the Dashboard SHALL NOT display a **User** column. Presenters SHALL see Time, Source App, Type, Action, and row selection for Full SQL without the Oracle username field.

#### Scenario: Latest Threats table headers

- **WHEN** the user views Latest Threats on the Dashboard
- **THEN** the table header SHALL NOT include **User**
- **AND** rows SHALL NOT show `username` in a dedicated column
