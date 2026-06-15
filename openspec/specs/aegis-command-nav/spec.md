# aegis-command-nav Specification

## Purpose
Simplified Aegis Vault Command Nav for presenter-focused demo flow.

## Requirements

### Requirement: Command Nav exposes only Dashboard and Break-Glass Control
The left **Command Nav** sidebar SHALL list exactly two navigable sections: **Dashboard** (primary, top) and **Break-Glass Control** (presenter panel, bottom). No other section buttons SHALL appear in Command Nav.

#### Scenario: Command Nav renders simplified items
- **WHEN** the user views the Aegis Vault shell on any screen size where Command Nav is visible
- **THEN** the nav SHALL show a **Dashboard** button
- **AND** the nav SHALL show a **Break-Glass Control** button
- **AND** the nav SHALL NOT show **Threat Feed** or **Violations** buttons

#### Scenario: Dashboard is default section
- **WHEN** the application loads
- **THEN** the active section SHALL be **Dashboard**
- **AND** the Dashboard center content (metrics, globe, Latest Threats) SHALL be visible

### Requirement: Violation visibility without removed nav sections
The application SHALL continue to surface firewall violations without Threat Feed or Violations nav entries.

#### Scenario: Dashboard shows latest violations
- **WHEN** the user is on **Dashboard**
- **THEN** the **Latest Threats** block with **Full SQL** SHALL remain available

#### Scenario: Right rail shows live violations
- **WHEN** the user views the layout at large breakpoints
- **THEN** the right-rail **Live Violations** compact table SHALL remain visible
