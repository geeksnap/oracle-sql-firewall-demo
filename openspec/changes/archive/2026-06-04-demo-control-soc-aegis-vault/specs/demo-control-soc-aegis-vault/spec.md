## ADDED Requirements

### Requirement: Demo Control SOC section title

Demo Control SHALL display section **2. Aegis Vault - Security Operation Center** (replacing **2. Security Operation Center**) with the existing subtitle describing `AEGIS_APP` detect-only posture.

#### Scenario: Presenter opens Demo Control

- **WHEN** the user navigates to Demo Control
- **THEN** section 2 heading reads **2. Aegis Vault - Security Operation Center**

### Requirement: Clear captured SQL rules for LuminaForge

The system SHALL provide a Demo Control action that resets LuminaForge SQL Firewall policy artifacts so capture and allow-list training can start again.

#### Scenario: Clear policy with confirmation

- **WHEN** the user clicks **Clear captured SQL rules** under LuminaForge Firewall setup (§3.3) and confirms
- **THEN** the backend runs `SYS.aegis_demo_control.clear_firewall_policy` for **luminaforge** (disable/drop allow-list; stop/drop capture as applicable)
- **AND** the Output console shows success or error text
- **AND** Monitored Apps / Policy refresh to show luminaforge without an active allow-list or capture (posture **NOT CONFIGURED** or capture OFF as appropriate)

#### Scenario: Clear policy declined

- **WHEN** the user cancels the confirmation dialog
- **THEN** no database mutation is performed

#### Scenario: Clear policy blocked for SOC user

- **WHEN** a client sends `clear-firewall-policy` for scope **aegis** targeting `AEGIS_APP`
- **THEN** the API rejects the action (luminaforge-only)

### Requirement: Monitored Apps shows LuminaForge only

The Monitored Apps panel SHALL list only the **LuminaForge** (`luminaforge`) application card and SHALL NOT display an **Aegis Vault** / `AEGIS_APP` card.

#### Scenario: Status poll after firewall change

- **WHEN** the dashboard receives a status update with monitored app data
- **THEN** Monitored Apps renders exactly one card labeled for LuminaForge
- **AND** no Aegis Vault card appears in that panel

### Requirement: Firewall Policy shows LuminaForge only

The Firewall Policy panel (Policy nav / right rail) SHALL show policy posture for **luminaforge** only and SHALL NOT show an Aegis Vault policy block.

#### Scenario: Policy view with global firewall on

- **WHEN** the user opens Policy with SQL Firewall enabled globally
- **THEN** only LuminaForge SQL Monitor / Block SQL / Capture flags are shown
- **AND** Aegis Vault is not listed in Firewall Policy
