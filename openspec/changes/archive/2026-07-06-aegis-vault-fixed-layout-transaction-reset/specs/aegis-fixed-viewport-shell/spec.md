## ADDED Requirements

### Requirement: Aegis Vault uses a fixed viewport shell from startup

The Aegis Vault application shell SHALL establish a fixed viewport frame on initial load at the large (`lg`) breakpoint. The outer layout SHALL NOT grow in height or width as violation rows or demo-control output increase. Internal scrolling SHALL occur only inside designated panel regions (violation tables, Full SQL, demo output console).

#### Scenario: Page height stable after many violations

- **WHEN** more than fifty firewall violations are recorded during a demo session
- **THEN** the browser document body SHALL NOT gain additional vertical scroll height solely due to violation rows
- **AND** violation data SHALL remain accessible via internal panel scrollbars

#### Scenario: Shell dimensions consistent across nav sections

- **WHEN** the presenter switches between **Dashboard** and **Break-Glass Control**
- **THEN** the overall application frame width and height SHALL remain the same at the `lg` breakpoint
- **AND** the three-column grid structure (sidebar, center, right rail) SHALL remain visible with the same column widths

#### Scenario: Right rail panels stay within fixed frame

- **WHEN** Live Violations, Monitored Apps, and Policy panels are rendered on Dashboard
- **THEN** each panel SHALL fit within the fixed right-rail column height
- **AND** Live Violations SHALL scroll internally when content exceeds its allocated height
