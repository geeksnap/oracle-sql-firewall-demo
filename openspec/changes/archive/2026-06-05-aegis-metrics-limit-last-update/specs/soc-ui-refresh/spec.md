## MODIFIED Requirements

### Requirement: Status Update terminology

The Aegis Vault UI SHALL use the label **Status Update** instead of **Poll** in all presenter-visible text (header sync label, dashboard metrics timestamp card, help strings, SPEC references). Internal API and socket event names MAY retain legacy poll identifiers (e.g. `last_poll_at`).

#### Scenario: Header shows Status Update

- **WHEN** the dashboard is connected to the database
- **THEN** the header displays a **Status Update** label with the interval in milliseconds (not “Poll sync”)

#### Scenario: Metrics card shows Last Update

- **WHEN** the user views the dashboard metrics row
- **THEN** the fourth metric card label SHALL read **Last Update** (not **Last Poll**)
- **AND** the value SHALL show the formatted time of the last successful status refresh

## ADDED Requirements

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
