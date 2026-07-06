# aegis-ui-layout-polish Specification

## Purpose
TBD - created by archiving change aegis-ui-layout-polish. Update Purpose after archive.
## Requirements
### Requirement: Break-Glass Control section has top spacing
The Break-Glass Control content area SHALL have additional top padding so the "Break-Glass Control" heading does not sit flush against the top of the main content column.

#### Scenario: Break-Glass Control panel has top breathing room
- **WHEN** the user navigates to the Break-Glass Control section and successfully authenticates
- **THEN** the "Break-Glass Control" heading SHALL appear with visible space above it (minimum `pt-4` / 16 px) relative to the top of the content area

### Requirement: Dashboard section has a summary header
The Dashboard section SHALL render a section-level header block above the metrics cards containing a title and subtitle that frame the view.

#### Scenario: Dashboard loads with a header
- **WHEN** the Dashboard section is active
- **THEN** a header block SHALL appear above the metrics cards with a title (e.g. "Security Operations Center") and a brief subtitle describing the view

#### Scenario: Header matches existing glass-panel style
- **WHEN** the Dashboard header is rendered
- **THEN** it SHALL use the same `glass-panel rounded-xl px-4 py-3` style as other header blocks in the application so the visual language is consistent

### Requirement: Break-Glass Control preserves shell width

The Break-Glass Control center column SHALL use the same fixed-width grid constraints as the Dashboard center column. Appending lines to the demo-control output console or loading additional firewall sections SHALL NOT change the overall application width or cause horizontal layout shift at the `lg` breakpoint.

#### Scenario: Width stable when demo output grows

- **WHEN** the presenter executes multiple demo-control actions that append many lines to the output console
- **THEN** the center column width SHALL remain unchanged
- **AND** output SHALL scroll inside the existing console region rather than expanding the page width

#### Scenario: Break-Glass matches Dashboard column structure

- **WHEN** the presenter toggles between Dashboard and Break-Glass Control on a large screen
- **THEN** the center column SHALL occupy the same `1fr` grid track width in both sections

