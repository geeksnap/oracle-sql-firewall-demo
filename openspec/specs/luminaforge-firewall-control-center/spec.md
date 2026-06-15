## ADDED Requirements

### Requirement: Aegis Vault fixed detect posture in UI

When global SQL Firewall is enabled, the Aegis Vault application (`AEGIS_APP`) SHALL always be displayed with **SQL Monitor ON** and **Block SQL OFF** in Monitored Apps and Firewall Policy, and defence label **DETECT · LOG ONLY**. This display SHALL NOT be changeable from Demo Control.

#### Scenario: Monitored Apps SOC row

- **WHEN** global firewall is enabled and status updates
- **THEN** Aegis Vault shows SQL Monitor ON, Block SQL OFF, and label **DETECT · LOG ONLY**

#### Scenario: Policy rail matches

- **WHEN** the right-rail Firewall Policy panel is visible
- **THEN** the Aegis Vault card shows the same SQL Monitor / Block SQL flags and defence label as Monitored Apps

### Requirement: Security Operation Center trimmed Demo Control

Section **2. Security Operation Center** SHALL offer only **View violations** and **Clear violation logs**. It SHALL NOT offer View SQL Monitor status or View capture status.

#### Scenario: SOC buttons after change

- **WHEN** the user opens Demo Control section 2
- **THEN** only view-violations and purge-violations actions are available for the aegis scope

### Requirement: Luminaforge Firewall Control Center single section

Demo Control SHALL present one section **3. Luminaforge — Firewall Control Center** (subtitle **User luminaforge**) with three sub-sections:

#### Scenario: Sub-section 3.1 Firewall control

- **WHEN** section 3 is displayed
- **THEN** sub-section **3.1 Firewall control** provides buttons to enable/disable SQL Monitoring and enable/disable Block SQL for luminaforge

#### Scenario: Sub-section 3.2 Firewall info

- **WHEN** section 3 is displayed
- **THEN** sub-section **3.2 Firewall info** provides View violations, View capture status, and View SQL Monitor status

#### Scenario: Sub-section 3.3 Firewall setup

- **WHEN** section 3 is displayed
- **THEN** sub-section **3.3 Firewall setup** provides Start SQL capture, Stop SQL capture, and Clear violation logs

#### Scenario: No duplicate legacy sections

- **WHEN** Demo Control is rendered
- **THEN** separate top-level “Firewall Setup” and “Luminaforge — SQL Monitor & operations” sections are not shown

### Requirement: SQL Monitor enable for LuminaForge

The system SHALL support enabling SQL Monitor enforcement for luminaforge via Demo Control (`sql-monitor-enable`), in addition to disable (`sql-monitor-disable`).

#### Scenario: Enable SQL Monitoring button

- **WHEN** the user clicks **Enable SQL Monitoring** under 3.1
- **THEN** luminaforge SQL Monitor is enabled in the database and Monitored Apps / Policy refresh to show SQL Monitor ON
