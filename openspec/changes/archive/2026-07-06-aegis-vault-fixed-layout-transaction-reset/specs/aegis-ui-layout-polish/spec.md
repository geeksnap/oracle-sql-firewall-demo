## ADDED Requirements

### Requirement: Break-Glass Control preserves shell width

The Break-Glass Control center column SHALL use the same fixed-width grid constraints as the Dashboard center column. Appending lines to the demo-control output console or loading additional firewall sections SHALL NOT change the overall application width or cause horizontal layout shift at the `lg` breakpoint.

#### Scenario: Width stable when demo output grows

- **WHEN** the presenter executes multiple demo-control actions that append many lines to the output console
- **THEN** the center column width SHALL remain unchanged
- **AND** output SHALL scroll inside the existing console region rather than expanding the page width

#### Scenario: Break-Glass matches Dashboard column structure

- **WHEN** the presenter toggles between Dashboard and Break-Glass Control on a large screen
- **THEN** the center column SHALL occupy the same `1fr` grid track width in both sections
