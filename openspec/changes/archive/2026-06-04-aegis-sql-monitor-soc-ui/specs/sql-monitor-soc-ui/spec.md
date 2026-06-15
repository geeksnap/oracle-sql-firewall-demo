## ADDED Requirements

### Requirement: Firewall Policy reflects full SQL Firewall posture

The right-rail **Firewall Policy** section SHALL display per monitored application the same defence label shown in **Monitored Apps**, plus explicit indicators for SQL Monitor (allow-list) enabled, block SQL enabled, and capture enabled, derived from `dba_sql_firewall_allow_lists` and `dba_sql_firewall_captures` with global firewall status applied.

#### Scenario: Policy matches Monitored Apps after LuminaForge block on

- **WHEN** LuminaForge SQL Monitor is enabled with block SQL on and global firewall is enabled
- **THEN** the LuminaForge row in Firewall Policy shows defence label **ENFORCED · BLOCK** (or equivalent) and block SQL indicated as on

#### Scenario: Policy shows monitor off

- **WHEN** LuminaForge SQL Monitor enforcement is disabled
- **THEN** Firewall Policy shows SQL Monitor as off and defence label consistent with Monitored Apps (e.g. **SQL MONITOR OFF**)

### Requirement: Security Operation Center section in Demo Control

Demo Control section 2 SHALL be titled **Security Operation Center** (database user `AEGIS_APP`). It SHALL NOT offer controls that enable SQL blocking or SQL Monitor enforcement for that user.

#### Scenario: SOC section label

- **WHEN** the user opens Demo Control
- **THEN** section 2 heading reads **Security Operation Center** (not “Aegis Vault (SOC user)” alone)

#### Scenario: SOC has no block or monitor toggles

- **WHEN** the user views section 2 actions
- **THEN** only view and purge actions are available; no block SQL, SQL Monitor, or capture toggles for AEGIS_APP

### Requirement: Aegis Vault fixed detect-only defence status

The Aegis Vault application (`AEGIS_APP`) SHALL always be presented as **detect and log only, never block** in Monitored Apps and Firewall Policy when global SQL Firewall is enabled. This posture SHALL NOT be changeable from Demo Control.

#### Scenario: SOC defence pill when firewall on

- **WHEN** global SQL Firewall is enabled
- **THEN** Aegis Vault Monitored Apps defence label is **DETECT · LOG ONLY** (or equivalent fixed copy)

#### Scenario: SOC cannot enable block from UI

- **WHEN** the user attempts to use Demo Control to block SQL for AEGIS_APP
- **THEN** no such control is offered in section 2

### Requirement: SQL Monitor terminology in user interface

User-visible text that referred to **allow-list** SHALL use **SQL Monitor** instead (Demo Control buttons, view labels, and defence pills where “ALLOW-LIST” appeared).

#### Scenario: LuminaForge stop enforcement button

- **WHEN** LuminaForge Demo Control risk actions are shown
- **THEN** the control reads **Stop SQL Monitor enforcement** (not “Stop allow-list enforcement”)

### Requirement: LuminaForge block SQL toggle independent of SQL Monitor

Demo Control SHALL provide **Enable block SQL** and **Disable block SQL** for LuminaForge that succeed whether SQL Monitor is enabled or disabled, by invoking `SYS.aegis_demo_control.set_sql_block` (or equivalent) that updates block enforcement without requiring the presenter to enable SQL Monitor first.

#### Scenario: Block SQL while monitor off

- **WHEN** LuminaForge SQL Monitor is disabled and the user clicks **Enable block SQL**
- **THEN** the operation completes successfully and subsequent **View SQL Monitor status** shows `BLOCK=Y` (or equivalent)

#### Scenario: Disable block while monitor on

- **WHEN** SQL Monitor is enabled with block on and the user clicks **Disable block SQL**
- **THEN** block SQL is turned off while SQL Monitor may remain enabled (log-only enforcement)

### Requirement: LuminaForge Firewall Setup three-column section

Demo Control SHALL include a **Firewall Setup** subsection for user luminaforge with a three-column layout: column 1 Start/Stop SQL capture, column 2 Enable block SQL, column 3 Disable block SQL.

#### Scenario: Firewall Setup layout

- **WHEN** the user opens Demo Control LuminaForge area
- **THEN** a section titled **Firewall Setup** with subtitle **User luminaforge** shows three columns with capture and block controls as specified

#### Scenario: Separate operations section

- **WHEN** Firewall Setup is present
- **THEN** view/risk operations (violations, SQL Monitor status, purge, stop SQL Monitor) remain in a distinct section below or after Firewall Setup
