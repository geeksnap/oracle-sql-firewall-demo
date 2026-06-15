# soc-ui-refresh Specification

## Purpose
Presenter-facing Aegis Vault SOC UI refresh — Status Update terminology, Demo Control layout, shield hero, header firewall status, and dashboard metrics.

## Requirements

### Requirement: Status Update terminology

The Aegis Vault UI SHALL use the label **Status Update** instead of **Poll** in all presenter-visible text (header sync label, dashboard metrics timestamp card, help strings, SPEC references). Internal API and socket event names MAY retain legacy poll identifiers (e.g. `last_poll_at`).

#### Scenario: Header shows Status Update

- **WHEN** the dashboard is connected to the database
- **THEN** the header displays a **Status Update** label with the interval in milliseconds (not “Poll sync”)

#### Scenario: Metrics card shows Last Update

- **WHEN** the user views the dashboard metrics row
- **THEN** the fourth metric card label SHALL read **Last Update** (not **Last Poll**)
- **AND** the value SHALL show the formatted time of the last successful status refresh

### Requirement: Dashboard metrics aggregate up to 200 violations

The dashboard metric cards **Total Violations**, **LuminaForge Hits**, and **Aegis Hits** SHALL be computed from the most recent firewall violation rows fetched for metrics, with a ceiling of **200** rows per status update cycle (monitored users `AEGIS_APP` and `LUMINAFORGE`). Counts SHALL NOT be capped at 50 when more violations exist in the dictionary within that window.

#### Scenario: Metrics exceed prior 50-row ceiling

- **WHEN** Oracle holds more than 50 violation rows for monitored users and a status update completes
- **THEN** Total Violations, LuminaForge Hits, and Aegis Hits MAY display values greater than 50, up to the number of rows returned within the 200-row fetch

#### Scenario: Metrics respect 200-row fetch window

- **WHEN** more than 200 violation rows exist in the dictionary
- **THEN** each metric count SHALL reflect only the latest 200 rows returned by the metrics fetch (not the full historical total)

#### Scenario: Poller and Demo Control use shared limit

- **WHEN** the background status poller or a successful Demo Control refresh builds metrics
- **THEN** both SHALL use the same documented metrics violation limit (200)

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
