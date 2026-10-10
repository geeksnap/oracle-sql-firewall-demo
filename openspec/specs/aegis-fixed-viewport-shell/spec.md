# aegis-fixed-viewport-shell Specification

## Purpose
Fixed viewport frame for Aegis Vault — stable shell dimensions from startup with internal panel scrolling only.

## Requirements

### Requirement: Aegis Vault uses a fixed viewport shell from startup

The Aegis Vault application shell SHALL establish a fixed viewport frame on initial load at the large (`lg`) breakpoint. The outer layout SHALL NOT grow in height or width as violation rows or demo-control output increase. Internal scrolling SHALL occur only inside designated panel regions (violation tables, Full SQL, demo output console). The application frame SHALL maintain a landscape **12:9** aspect ratio (width : height = 12 : 9, i.e. 4:3) from first paint and SHALL remain that ratio when switching between Dashboard and Break-Glass Control.

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

### Requirement: Application frame is landscape 12:9 and centered

At the large (`lg`) breakpoint, the Aegis Vault shell SHALL render as a centered landscape rectangle whose width-to-height ratio is **12:9** (4:3, not 16:9). The frame SHALL be sized to the largest 12:9 rectangle that fits within the browser viewport (accounting for page padding). The area outside the frame SHALL use the application background color without additional page scroll.

#### Scenario: Landscape 12:9 frame on wide monitor

- **WHEN** the presenter opens Aegis Vault on a 1920×1080 display at the `lg` breakpoint
- **THEN** the application frame width-to-height ratio SHALL be 12:9
- **AND** the frame SHALL be centered in the browser window
- **AND** the frame SHALL NOT be square (1:1) and SHALL NOT be 16:9

#### Scenario: Frame on tall narrow viewport

- **WHEN** the viewport is taller than it is wide (e.g. portrait or narrow window)
- **THEN** the application frame SHALL keep a 12:9 width-to-height ratio
- **AND** the frame SHALL fit entirely within the viewport without body scroll

#### Scenario: Aspect ratio unchanged after nav toggle

- **WHEN** the presenter toggles between Dashboard and Break-Glass Control
- **THEN** the outer frame SHALL remain 12:9 with the same pixel width and height as before the toggle
