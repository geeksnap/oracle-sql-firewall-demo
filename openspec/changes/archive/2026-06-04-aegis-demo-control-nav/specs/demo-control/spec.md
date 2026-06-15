## ADDED Requirements

### Requirement: Demo Control navigation entry

The Aegis Vault sidebar Command NAV SHALL include an item labeled **Demo Control** with the same cyberpunk glassmorphism styling as existing nav items. Selecting it SHALL display the Demo Control view in the main content area.

#### Scenario: User opens Demo Control

- **WHEN** the user clicks **Demo Control** in the sidebar
- **THEN** the main panel shows the Demo Control layout (four sections)
- **AND** other nav sections are deselected visually

### Requirement: Four-section Demo Control layout

The Demo Control view SHALL contain four labeled sections in order:

1. **System-wide Firewall Control**
2. **Aegis Vault Firewall Control** (database user `AEGIS_APP`)
3. **LuminaForge Firewall Control** (database user `luminaforge`)
4. **Output**

Sections 1–3 SHALL use glass panels consistent with the SOC theme (neon cyan/magenta accents, dark background).

#### Scenario: Layout visible on load

- **WHEN** Demo Control is active
- **THEN** all four section headers are visible without horizontal scrolling on a desktop viewport

### Requirement: System-wide firewall buttons

Section 1 SHALL provide buttons that execute only the following whitelisted operations:

| Button label | Effect |
|--------------|--------|
| Firewall off globally | `SYS.DBMS_SQL_FIREWALL.DISABLE` |
| Firewall on globally | `SYS.DBMS_SQL_FIREWALL.ENABLE` |
| Clear all demo violation logs | `PURGE_LOG` violation logs for `AEGIS_APP` and `luminaforge`, then `FLUSH_LOGS` |
| View violations (all) | `SELECT` from `DBA_SQL_FIREWALL_VIOLATIONS` for monitored users (capped rows) |

#### Scenario: Global disable

- **WHEN** the user clicks **Firewall off globally**
- **THEN** the system executes the global DISABLE procedure in the PDB
- **AND** the Output section shows the SQL and success or error message

#### Scenario: Global enable

- **WHEN** the user clicks **Firewall on globally**
- **THEN** the system executes `SYS.DBMS_SQL_FIREWALL.ENABLE`
- **AND** the Output section shows the SQL and result

### Requirement: Per-application firewall buttons

Sections 2 and 3 SHALL expose the same button set, scoped to `AEGIS_APP` (section 2) and `luminaforge` (section 3):

| Button label | Effect |
|--------------|--------|
| Block attacks | `UPDATE_ALLOW_LIST_ENFORCEMENT(username, block => TRUE)` or equivalent enable with block TRUE |
| Allow attacks, still log | `UPDATE_ALLOW_LIST_ENFORCEMENT(username, block => FALSE)` |
| Stop allow-list enforcement | `DISABLE_ALLOW_LIST(username)` |
| Clear violation logs | `PURGE_LOG` violation logs for that user only, then `FLUSH_LOGS` |
| View in DB | `SELECT` from `DBA_SQL_FIREWALL_VIOLATIONS` for that user (capped rows) |
| View allow-list status | `SELECT` from `DBA_SQL_FIREWALL_ALLOW_LISTS` for that user |
| View capture status | `SELECT` from `DBA_SQL_FIREWALL_CAPTURES` for that user |

Operations that are only meaningful globally SHALL NOT appear in sections 2 or 3.

#### Scenario: Block luminaforge attacks

- **WHEN** the user clicks **Block attacks** under LuminaForge Firewall Control
- **THEN** the system sets `block => TRUE` for user `luminaforge`
- **AND** the Output section records the SQL and result

#### Scenario: Per-user purge

- **WHEN** the user clicks **Clear violation logs** under Aegis Vault Firewall Control
- **THEN** only `AEGIS_APP` violation logs are purged
- **AND** `luminaforge` violation rows remain unless cleared separately

### Requirement: Output console

Section 4 SHALL provide a scrollable text area with minimum visible height equivalent to approximately **15 rows** of monospace text. Each button action SHALL append:

- A timestamp
- The SQL (or procedure call) executed
- The execution result (success message, row listing, or Oracle error text)

Older output SHALL remain scrollable above newer entries.

#### Scenario: Multiple actions append

- **WHEN** the user runs two different demo buttons in sequence
- **THEN** the Output panel contains two distinct blocks separated visually
- **AND** the panel auto-scrolls to show the latest result

### Requirement: Server-side execution only

The browser SHALL NOT send raw SQL strings. The client SHALL send only `{ scope, action }` enums; the server SHALL map actions to whitelisted PL/SQL via definer procedures granted to `AEGIS_APP`.

#### Scenario: Rejected arbitrary SQL

- **WHEN** a client POST includes an unknown `action` value
- **THEN** the API returns HTTP 400
- **AND** no SQL is executed

### Requirement: Dashboard refresh after mutations

After any successful state-changing demo action (enable, disable, block toggle, purge), the system SHALL flush firewall logs when permitted and SHALL trigger an immediate violations poll so the Threat Feed and metrics update without waiting for the normal poll interval.

#### Scenario: Purge clears UI data

- **WHEN** the user clears violation logs successfully
- **THEN** the Output shows purge confirmation
- **AND** the violations table in Aegis Vault reflects zero or reduced rows on the next poll cycle

### Requirement: Error handling

Failed operations SHALL display the Oracle error message (e.g. `ORA-xxxxx`) in the Output panel without crashing the application.

#### Scenario: Missing grant

- **WHEN** definer procedures are not installed and the user clicks a demo button
- **THEN** the Output panel shows a clear error including ORA/PLS code
- **AND** the UI remains usable
