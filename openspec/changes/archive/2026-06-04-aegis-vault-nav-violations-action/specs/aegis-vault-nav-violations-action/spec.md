## ADDED Requirements

### Requirement: Policy removed from Command NAV

The left Command NAV SHALL NOT include a **Policy** item, and the main content area SHALL NOT render a dedicated Policy page.

#### Scenario: Presenter opens sidebar

- **WHEN** the user views the Command NAV
- **THEN** nav items are Dashboard, Threat Feed, Violations, and Demo Control (no Policy)

#### Scenario: Policy posture still visible on dashboard layout

- **WHEN** the user is on Dashboard on a large viewport
- **THEN** firewall posture for LuminaForge remains visible via Monitored Apps (and/or right-rail policy panel) without a Policy nav entry

### Requirement: Violations tables show Action column

Threat Feed and All Violations views SHALL include an **Action** column describing SQL Firewall enforcement outcome for each row.

#### Scenario: Blocked violation

- **WHEN** a violation row has `FIREWALL_ACTION` indicating block (e.g. `BLOCKED`)
- **THEN** the Action column displays **Blocked**

#### Scenario: Log-only violation

- **WHEN** a violation row has `FIREWALL_ACTION` indicating allow/log (e.g. not blocked)
- **THEN** the Action column displays **Logged without Block**

#### Scenario: Unknown action

- **WHEN** `FIREWALL_ACTION` is missing or unrecognized
- **THEN** the Action column displays a neutral fallback (e.g. **Unknown** or the raw value)

### Requirement: Type column shows violation cause

The **Type** column SHALL display the SQL Firewall **cause** (`CAUSE` from `DBA_SQL_FIREWALL_VIOLATIONS`), not the firewall action.

#### Scenario: Row with cause and action

- **WHEN** a violation has both `CAUSE` and `FIREWALL_ACTION` populated
- **THEN** Type shows the cause (e.g. SQL violation) and Action shows blocked vs logged outcome separately
