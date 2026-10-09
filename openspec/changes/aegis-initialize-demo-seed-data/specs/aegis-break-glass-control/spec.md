## ADDED Requirements

### Requirement: Initialize Demo Seed Data requires break-glass grant

**Initialize Demo Seed Data** SHALL execute only when the current browser session holds a valid break-glass grant. If the presenter activates the control without that grant, the system SHALL open the existing break-glass login modal (same demo credential rules as **Break-Glass Control**) and SHALL NOT mutate demo tables until login succeeds and the presenter confirms the destructive reload.

#### Scenario: Unauthenticated click prompts break-glass login

- **WHEN** the presenter clicks **Initialize Demo Seed Data** without a current break-glass grant
- **THEN** the break-glass login modal SHALL appear
- **AND** no demo-table delete or reseed SHALL run until after successful login and confirmation

#### Scenario: Authenticated click proceeds to confirm then execute

- **WHEN** the presenter already has a break-glass grant and clicks **Initialize Demo Seed Data**
- **THEN** the system SHALL show the destructive confirmation dialog
- **AND** on confirm SHALL invoke the whitelisted demo-control seed-init action

#### Scenario: API rejects seed init without break-glass grant

- **WHEN** an unauthenticated client posts the initialize-demo-seed-data demo-control action without a valid break-glass grant
- **THEN** the API SHALL reject the request
- **AND** no LuminaForge demo table data SHALL change
