## ADDED Requirements

### Requirement: Sidebar shows Break-Glass Control instead of Demo Control

The Aegis Vault left sidebar SHALL display a bottom nav button labeled **Break-Glass Control** (replacing **Demo Control**) with the same destructive/red visual treatment. Selecting it SHALL activate the `break-glass-control` navigation section.

#### Scenario: Presenter sees renamed nav item
- **WHEN** the Aegis Vault dashboard loads
- **THEN** the bottom sidebar button reads **Break-Glass Control** and not **Demo Control**

#### Scenario: Selecting Break-Glass Control activates the section
- **WHEN** the presenter clicks **Break-Glass Control**
- **THEN** the main content area switches to the break-glass section and the button appears selected

### Requirement: Break-glass login modal accepts demo credentials

When **Break-Glass Control** is selected and break-glass login has not yet succeeded in the current browser session, the system SHALL display a centered modal with fields **Break-Glass User** and **Password**. On submit, the system SHALL accept any non-empty username and any password value (demo mode — no server-side credential validation).

#### Scenario: Modal appears on first access
- **WHEN** the presenter selects **Break-Glass Control** before logging in this session
- **THEN** a centered modal prompts for Break-Glass User and Password

#### Scenario: Demo login succeeds with arbitrary credentials
- **WHEN** the presenter enters any non-empty username and any password and submits
- **THEN** the modal closes and the presenter firewall panel becomes available

#### Scenario: Empty username is rejected
- **WHEN** the presenter submits with an empty Break-Glass User
- **THEN** the modal remains open with a visible validation message and no violation is logged

### Requirement: Break-glass login creates a Live Violations event

On successful break-glass login, the system SHALL record a synthetic violation visible in **Live Violations** and the Threat Feed with these values:

| Column | Value |
|---|---|
| Time | current time at login |
| Source App | `Aegis Vault` |
| User | Break-Glass User entered in the modal |
| Action | `Break-Glass Logged in` |
| SQL | `N/A` |

The password SHALL NOT appear in the violation row or logs.

#### Scenario: Live Violations row matches presenter script
- **WHEN** break-glass login succeeds with username `ops-lead`
- **THEN** a new row appears with Source App `Aegis Vault`, User `ops-lead`, Action `Break-Glass Logged in`, SQL `N/A`, and Time approximately the login moment

#### Scenario: Compact Live Violations shows break-glass on three columns
- **WHEN** break-glass login succeeds and the right-rail **Live Violations** panel uses `variant="compact"`
- **THEN** the row shows Time (now), Source App `Aegis Vault`, and Type `Break-Glass Logged in`

#### Scenario: Event appears without Oracle dictionary write
- **WHEN** break-glass login succeeds
- **THEN** the row appears in the UI without inserting into `SYS.DBA_SQL_FIREWALL_VIOLATIONS`

#### Scenario: Event survives the next status poll
- **WHEN** a status poll cycle completes after break-glass login
- **THEN** the break-glass row remains visible in Live Violations (merged with Oracle-sourced rows)

### Requirement: Break-glass login is broadcast in real time

The system SHALL emit the synthetic violation on the existing WebSocket `violation` channel so all connected Aegis Vault clients update the feed immediately.

#### Scenario: WebSocket clients receive the event
- **WHEN** break-glass login succeeds via `POST /api/break-glass/login`
- **THEN** connected clients receive a `violation` event containing the synthetic row fields
