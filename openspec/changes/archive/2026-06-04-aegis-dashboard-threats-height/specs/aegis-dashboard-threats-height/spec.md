## ADDED Requirements

### Requirement: Dashboard Latest Threats block fills half the center column to Command Nav baseline
On the Dashboard, the combined **Latest Threats** table and **Full SQL** panel SHALL occupy approximately half of the center column height and SHALL extend downward to align with the bottom of the **Command Nav** sidebar column on large (`lg`) layouts.

#### Scenario: Large viewport layout
- **WHEN** the user views the Dashboard on a large screen
- **THEN** the center column SHALL stretch to the same row height as the Command Nav sidebar
- **AND** the Latest Threats + Full SQL block SHALL use at least 50% of the center column height below the metrics and globe
- **AND** the bottom of the Latest Threats block SHALL align with the bottom of the Command Nav panel

### Requirement: Latest Threats shows more rows with internal scroll
The Latest Threats table SHALL display more violation rows than the previous eight-row cap and SHALL scroll within its pane when content exceeds the visible area.

#### Scenario: More rows visible
- **WHEN** more than eight violations exist
- **THEN** the Dashboard SHALL pass at least twelve latest violations to the Latest Threats table
- **AND** the table body SHALL scroll inside the enlarged panel without growing the page layout

### Requirement: Full SQL detail behavior preserved in enlarged block
Within the enlarged Dashboard block, the internal split SHALL remain approximately two-thirds table and one-third **Full SQL**, with row selection showing the full `sql_text` unchanged.

#### Scenario: Row selection in tall Dashboard block
- **WHEN** the user clicks a row in Latest Threats on the Dashboard
- **THEN** the row SHALL highlight
- **AND** the Full SQL panel SHALL show the complete SQL for that row
