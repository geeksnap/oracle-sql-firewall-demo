## ADDED Requirements

### Requirement: Break-Glass login is required on every sidebar click
The system SHALL open the Break-Glass login modal every time the user clicks the "Break-Glass Control" sidebar item, regardless of whether the user has previously authenticated in the current session.

#### Scenario: First click opens modal
- **WHEN** the user clicks "Break-Glass Control" in the sidebar for the first time
- **THEN** the Break-Glass login modal is displayed

#### Scenario: Subsequent click after successful login also opens modal
- **WHEN** the user has already logged in via Break-Glass in the current session AND clicks "Break-Glass Control" again (from any section)
- **THEN** the Break-Glass login modal is displayed again, requiring fresh credentials

#### Scenario: Navigating away and back requires re-authentication
- **WHEN** the user is on the Break-Glass Control panel AND navigates to another sidebar section AND then clicks "Break-Glass Control" again
- **THEN** the Break-Glass login modal is displayed and the panel is not shown until login succeeds

### Requirement: Panel access is granted per login, not per session
The Break-Glass Control panel SHALL only be visible immediately following a successful login within the same navigation event. Navigating away from the section SHALL revoke access.

#### Scenario: Panel shown after successful login
- **WHEN** the user completes Break-Glass login successfully
- **THEN** the Break-Glass Control panel (firewall presenter controls) is displayed

#### Scenario: Panel hidden after navigating away
- **WHEN** the user navigates from "Break-Glass Control" to any other sidebar section
- **THEN** the Break-Glass Control panel is no longer visible and the grant state is cleared

### Requirement: Every Break-Glass login produces a violation record
The system SHALL emit a violation alert and add a row to the Live Violations feed for every successful Break-Glass login, including repeat logins by the same user in the same session.

#### Scenario: Repeat login by same user creates new violation row
- **WHEN** the same Break-Glass username submits the login form more than once in a session
- **THEN** a new violation record with a new timestamp appears in the Live Violations feed for each submission

#### Scenario: Violation record appears within one poll cycle
- **WHEN** a Break-Glass login succeeds
- **THEN** a "Break-Glass Logged in" violation row is visible in the Live Violations compact rail within 5 seconds

## MODIFIED Requirements

### Requirement: Break-Glass authentication behaviour
The Break-Glass Control section SHALL require the user to authenticate via the login modal on every navigation to that section. After successful authentication, the panel SHALL be accessible until the user navigates away. The authenticated state SHALL NOT persist beyond a single navigation event.

#### Scenario: Modal always shown on navigation to section
- **WHEN** user selects "Break-Glass Control" in the sidebar
- **THEN** the login modal is shown unconditionally

#### Scenario: Successful login shows panel
- **WHEN** user enters a Break-Glass User (any value) and submits
- **THEN** the presenter firewall controls panel is shown

#### Scenario: Authentication state does not persist across navigation
- **WHEN** user navigates away from "Break-Glass Control"
- **THEN** any subsequent click on "Break-Glass Control" again requires re-authentication
