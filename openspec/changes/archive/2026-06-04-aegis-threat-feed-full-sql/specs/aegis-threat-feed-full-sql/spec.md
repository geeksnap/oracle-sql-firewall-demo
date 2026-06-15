## ADDED Requirements

### Requirement: Threat Feed uses a split layout with Full SQL panel
The Threat Feed section SHALL divide its vertical space equally between the violations table (top) and a **Full SQL** detail panel (bottom), each occupying approximately half of the Threat Feed content area height.

#### Scenario: Threat Feed displays two stacked panels
- **WHEN** the user navigates to the Threat Feed section
- **THEN** the violations table SHALL appear in the upper half of the section
- **AND** a panel titled **Full SQL** SHALL appear in the lower half of the section

### Requirement: Row selection drives Full SQL content
The violations table in Threat Feed SHALL support row selection. When a row is highlighted (selected), the Full SQL panel SHALL display that violation's complete `sql_text` without truncation.

#### Scenario: User selects a violation row
- **WHEN** the user clicks a row in the Threat Feed table
- **THEN** that row SHALL be visually highlighted as selected
- **AND** the Full SQL panel SHALL show the full SQL text for that violation

#### Scenario: User changes selection
- **WHEN** the user clicks a different row
- **THEN** the highlight SHALL move to the new row
- **AND** the Full SQL panel SHALL update to the newly selected violation's SQL text

#### Scenario: No row selected
- **WHEN** no row has been selected yet
- **THEN** the Full SQL panel SHALL show a placeholder instructing the user to select a row

### Requirement: Full SQL panel supports long statements
The Full SQL panel SHALL allow scrolling when SQL text exceeds the panel height.

#### Scenario: Long SQL is scrollable
- **WHEN** the selected violation has SQL longer than the panel height
- **THEN** the Full SQL panel SHALL provide vertical scrolling within the panel
- **AND** the full statement SHALL remain readable (no ellipsis truncation in the detail panel)
