## MODIFIED Requirements

### Requirement: Aegis Vault uses a fixed viewport shell from startup

The Aegis Vault application shell SHALL establish a fixed viewport frame on initial load at the large (`lg`) breakpoint. The outer layout SHALL NOT grow in height or width as violation rows or demo-control output increase. Internal scrolling SHALL occur only inside designated panel regions (violation tables, Full SQL, demo output console). The application frame SHALL maintain a **1:1 aspect ratio** (width equals height) from first paint and SHALL remain square when switching between Dashboard and Break-Glass Control.

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

### Requirement: Application frame is square and centered

At the large (`lg`) breakpoint, the Aegis Vault shell SHALL render as a centered square whose width and height are equal. The square SHALL be sized to the largest dimension that fits within the browser viewport (accounting for page padding), i.e. `min(available viewport width, available viewport height)`. The area outside the square SHALL use the application background color without additional page scroll.

#### Scenario: Square frame on wide monitor

- **WHEN** the presenter opens Aegis Vault on a 1920×1080 display at the `lg` breakpoint
- **THEN** the application frame width SHALL equal its height
- **AND** the frame SHALL be centered in the browser window
- **AND** the frame SHALL NOT stretch to full 1920px width as a wide rectangle

#### Scenario: Square frame on tall narrow viewport

- **WHEN** the viewport is taller than it is wide (e.g. portrait or narrow window)
- **THEN** the application frame width SHALL equal its height
- **AND** the frame SHALL fit entirely within the viewport without body scroll

#### Scenario: Aspect ratio unchanged after nav toggle

- **WHEN** the presenter toggles between Dashboard and Break-Glass Control
- **THEN** the outer frame SHALL remain 1:1 with the same pixel width and height as before the toggle
