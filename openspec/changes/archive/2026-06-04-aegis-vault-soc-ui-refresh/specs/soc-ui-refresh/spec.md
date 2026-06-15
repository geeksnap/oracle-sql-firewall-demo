## ADDED Requirements

### Requirement: Status Update terminology

The Aegis Vault UI SHALL use the label **Status Update** instead of **Poll** in all presenter-visible text (header sync label, help strings, SPEC references). Internal API and socket event names MAY retain legacy poll identifiers.

#### Scenario: Header shows Status Update

- **WHEN** the dashboard is connected to the database
- **THEN** the header displays a **Status Update** label with the interval in milliseconds (not “Poll sync”)

### Requirement: Demo Control navigation placement and styling

The Command NAV SHALL list **Demo Control** as the last item, visually separated at the bottom of the sidebar. When Demo Control is active, its highlight color SHALL be dark red (not magenta/cyan).

#### Scenario: Demo Control at bottom

- **WHEN** the user views the Command NAV
- **THEN** Demo Control appears below Dashboard, Threat Feed, Policy, Violations, and Monitored Apps

#### Scenario: Active Demo Control styling

- **WHEN** the user selects Demo Control
- **THEN** the nav item uses dark red border, background, and text styling distinct from other nav items

### Requirement: Aegis Shield hero presentation

The dashboard SHALL display an enlarged, elegant Aegis Shield visual (minimum ~480px height on desktop) as the primary hero element, with refined animation and alert-state coloring when LuminaForge is under attack.

#### Scenario: Shield visible on dashboard

- **WHEN** the user opens the Dashboard section
- **THEN** the shield hero occupies a prominently larger area than the previous globe-only layout

### Requirement: Header firewall status reflects global SQL Firewall

The header **Firewall** status pill SHALL reflect whether SQL Firewall is globally enabled or disabled in the database. It SHALL update after a successful **Firewall off globally** or **Firewall on globally** Demo Control action without requiring a full page reload.

#### Scenario: Firewall off after demo action

- **WHEN** the presenter successfully runs **Firewall off globally** in Demo Control
- **THEN** the header Firewall pill shows OFFLINE (or equivalent inactive state) within one second

#### Scenario: Firewall on after demo action

- **WHEN** the presenter successfully runs **Firewall on globally** in Demo Control
- **THEN** the header Firewall pill shows ACTIVE within one second

#### Scenario: Initial load reflects database

- **WHEN** the dashboard connects and receives the first status update from the server
- **THEN** the Firewall pill matches the global status from `dba_sql_firewall_status` (or documented fallback)

### Requirement: Demo Control tri-column button layout

Each Demo Control section (System-wide, Aegis Vault, LuminaForge) SHALL arrange action buttons in three columns: **green** (protective) on the left, **blue** (neutral/view) in the center, and **red** (reduces protection / destructive) on the right.

#### Scenario: System-wide column assignment

- **WHEN** the user views System-wide Firewall Control
- **THEN** **Firewall on globally** is in the left column, **View violations (all)** in the center, and **Firewall off globally** and **Clear all violation logs** in the right column

#### Scenario: Per-app column assignment

- **WHEN** the user views Aegis Vault or LuminaForge Firewall Control
- **THEN** **Block attacks** is left, view/status buttons are center, and **Stop allow-list enforcement** and **Clear violation logs** are right

### Requirement: Monitored Apps show per-app firewall control status

The Monitored Apps panel SHALL display each application’s SQL Firewall **control status** (from allow-list metadata) in place of a generic **ONLINE** connection pill. Status SHALL refresh on each server status update cycle and after Demo Control actions that change allow-list enforcement.

#### Scenario: LuminaForge with block enforcement

- **WHEN** luminaforge has an enabled allow-list with block enforcement
- **THEN** the LuminaForge card status pill shows **ENFORCED · BLOCK** (or equivalent mapped label), not **ONLINE**

#### Scenario: Allow-list disabled for user

- **WHEN** allow-list enforcement is disabled for AEGIS_APP or luminaforge
- **THEN** the card pill shows **ALLOW-LIST OFF** for that user

#### Scenario: Global firewall disabled

- **WHEN** SQL Firewall is globally disabled
- **THEN** both Monitored Apps cards show **FIREWALL OFF** in the status pill

#### Scenario: Recent violations highlight

- **WHEN** an app has one or more violations in the current snapshot
- **THEN** the card uses alert styling (border/background) while the pill still shows firewall control status (not **ONLINE**)

#### Scenario: Capture line unchanged

- **WHEN** the Monitored Apps card is rendered
- **THEN** the detail row still shows **Capture: ON/OFF** and **Violations: N** beneath the firewall control pill
