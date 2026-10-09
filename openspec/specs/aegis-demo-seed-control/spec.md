# aegis-demo-seed-control Specification

## Purpose
Defines the guarded Aegis Vault presenter control that authorizes, confirms, invokes, and reports destructive demo seed initialization.

## Requirements

### Requirement: Sidebar exposes demo seed initialization below Break-Glass Control
The Aegis Vault sidebar SHALL render a separate button labeled **Initialize Demo Seed Data** immediately below **Break-Glass Control**, using destructive presenter-control styling and remaining distinct from navigation selection.

#### Scenario: Presenter views the sidebar
- **WHEN** the Aegis Vault dashboard loads
- **THEN** **Initialize Demo Seed Data** appears directly below **Break-Glass Control**
- **AND** activating it does not navigate away from the current dashboard section

### Requirement: Seed initialization requires current break-glass authorization
The client and server SHALL require a valid, current break-glass grant for seed initialization. A client-only navigation state or direct API request SHALL NOT authorize the mutation, and leaving Break-Glass Control or expiration SHALL invalidate the grant.

#### Scenario: Presenter has no valid grant
- **WHEN** the presenter activates **Initialize Demo Seed Data** without a current break-glass grant
- **THEN** the break-glass login modal is shown
- **AND** no confirmation or database mutation occurs until login succeeds

#### Scenario: Direct unauthenticated request
- **WHEN** a client calls the initialization endpoint without a valid server-verifiable break-glass grant
- **THEN** the server returns an authorization error
- **AND** no seed table is changed

#### Scenario: Grant is no longer current
- **WHEN** the presenter leaves Break-Glass Control or the grant expires
- **THEN** a later initialization attempt requires break-glass login again

### Requirement: Seed initialization requires explicit destructive confirmation
After authorization, Aegis SHALL show a confirmation that names `LUMINAFORGE.USERS`, `PORTFOLIO`, `TRANSACTIONS`, and `LUXURY_ITEMS`, states that their data will be replaced, and requires the exact phrase `RESET LUMINAFORGE DEMO DATA`.

#### Scenario: Exact confirmation is supplied
- **WHEN** an authorized presenter enters the exact confirmation phrase and confirms
- **THEN** Aegis submits the whitelisted seed-initialization action once

#### Scenario: Confirmation is cancelled or does not match
- **WHEN** the presenter cancels or enters any other value
- **THEN** the initialization request is not sent
- **AND** no database mutation occurs

### Requirement: Initialization action is serialized in the presenter UI
While initialization is in flight, Aegis SHALL disable repeated submission and show progress. On completion it SHALL show the safe server result and re-enable the action without requiring a page reload.

#### Scenario: Presenter double-clicks
- **WHEN** an initialization request is already in flight
- **THEN** another request cannot be submitted from that client

#### Scenario: Initialization succeeds
- **WHEN** the server reports a committed initialization
- **THEN** Aegis shows the target anchor and per-table row counts
- **AND** the control becomes usable again

#### Scenario: Initialization fails
- **WHEN** the server rejects or rolls back initialization
- **THEN** Aegis shows the safe failure message and rollback status
- **AND** the control becomes usable again
