## MODIFIED Requirements

### Requirement: Command Nav exposes only Dashboard and Break-Glass Control

The left **Command Nav** sidebar SHALL list exactly two navigable sections: **Dashboard** (primary, top) and **Break-Glass Control** (presenter panel, bottom). No other navigable section buttons SHALL appear in Command Nav. Command Nav MAY additionally show a non-navigational action control labeled **Initialize Demo Seed Data** directly beneath **Break-Glass Control**; activating that control SHALL NOT count as selecting a third nav section.

#### Scenario: Command Nav renders simplified items

- **WHEN** the user views the Aegis Vault shell on any screen size where Command Nav is visible
- **THEN** the nav SHALL show a **Dashboard** button
- **AND** the nav SHALL show a **Break-Glass Control** button
- **AND** the nav SHALL NOT show **Threat Feed** or **Violations** buttons

#### Scenario: Seed action sits under Break-Glass without adding a section

- **WHEN** the user views Command Nav
- **THEN** **Initialize Demo Seed Data** SHALL appear under **Break-Glass Control**
- **AND** activating it SHALL NOT set the active navigable section to a new id beyond `dashboard` | `break-glass-control`

#### Scenario: Dashboard is default section

- **WHEN** the application loads
- **THEN** the active section SHALL be **Dashboard**
- **AND** the Dashboard center content (metrics, globe, Latest Threats) SHALL be visible
