## ADDED Requirements

### Requirement: Demo Control protect actions in section header

For **System-wide Firewall Control** and **LuminaForge Firewall Control**, the UI SHALL render **Protect** (green) demo buttons in the **upper-right** of the section card header area, aligned opposite the section title.

#### Scenario: Global protect placement

- **WHEN** the user opens Demo Control
- **THEN** section “1. System-wide Firewall Control” shows “Firewall on globally” in the upper-right of that section’s header row

#### Scenario: LuminaForge protect placement

- **WHEN** the user opens Demo Control
- **THEN** section “3. LuminaForge Firewall Control” shows “Block attacks” in the upper-right of that section’s header row

### Requirement: Demo Control view and risk three-column body

Below each section header, Demo Control SHALL use a **three-column** grid where **View** (blue) buttons occupy the **left** and **middle** columns and **Risk** (red) buttons occupy the **right** column only.

#### Scenario: LuminaForge view split

- **WHEN** section 3 body is rendered
- **THEN** “Allow attacks, still log” and “View in DB (violations)” appear in the left column, “View allow-list status” and “View capture status” in the middle column, and “Stop allow-list enforcement” and “Clear violation logs” in the right column

#### Scenario: Global risk column

- **WHEN** section 1 body is rendered
- **THEN** “Firewall off globally” and “Clear all violation logs” appear in the right column

#### Scenario: Aegis view and risk without protect

- **WHEN** section 2 (AEGIS_APP SOC) is rendered
- **THEN** no Protect button appears in the header and View/Risk buttons follow the same left/middle/right column pattern

### Requirement: Compact Demo Control sections

Sections **1**, **2**, and **3** SHALL use reduced vertical spacing (tighter padding and gaps) compared to the pre-change layout so the three sections consume less total height on the Demo Control page.

#### Scenario: Reduced section height

- **WHEN** Demo Control is displayed at desktop width
- **THEN** the combined height of sections 1–3 is visibly less than the previous three-column Protect|View|Risk grid layout (no extra footer paragraph under LuminaForge)

### Requirement: Firewall Policy on right rail under Monitored Apps

On viewports where the right rail is visible (`lg` and above), the UI SHALL render **Firewall Policy** (`PolicyPanel`) **directly below** **Monitored Apps** in the right column, above the live violations table.

#### Scenario: Policy visible on dashboard

- **WHEN** the user is on the Dashboard with a wide viewport
- **THEN** Monitored Apps appears above Firewall Policy in the right rail

### Requirement: Monitored Apps removed from Command NAV

The Command NAV SHALL NOT include a **Monitored Apps** navigation item. Monitored app status SHALL remain available via the right-rail **Monitored Apps** panel on supported layouts.

#### Scenario: Sidebar nav items

- **WHEN** the user views Command NAV
- **THEN** entries include Dashboard, Threat Feed, Policy, Violations, and Demo Control (bottom) but not Monitored Apps

#### Scenario: No monitored-apps route

- **WHEN** the user navigates only via Command NAV
- **THEN** there is no route or section state that renders a full-page Monitored Apps view
