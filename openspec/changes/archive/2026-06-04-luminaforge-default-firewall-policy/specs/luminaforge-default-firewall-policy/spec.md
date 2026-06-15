## ADDED Requirements

### Requirement: Initialize default LuminaForge demo policy

The system SHALL provide a Demo Control action that installs a **predefined SQL Firewall allow-list** for user **luminaforge** without requiring the presenter to run SQL capture or `GENERATE_ALLOW_LIST` manually.

#### Scenario: Load default policy

- **WHEN** the user clicks **Initialize default demo policy** in §3.3 Firewall setup and confirms
- **THEN** the backend runs `SYS.aegis_demo_control.init_default_demo_policy` for luminaforge
- **AND** any existing allow-list and capture for luminaforge are cleared before import
- **AND** the bundled allow-list is imported and SQL Monitor is enabled with **Block SQL OFF**
- **AND** SQL capture is **not** started
- **AND** Monitored Apps shows LuminaForge as **ENFORCED · LOG** (or equivalent log-only label)

#### Scenario: Default policy declined

- **WHEN** the user cancels the confirmation dialog
- **THEN** no database mutation is performed

#### Scenario: Not available for SOC user

- **WHEN** a client requests `init-default-policy` for scope **aegis**
- **THEN** the API rejects the action (luminaforge-only)

### Requirement: Default allow-list covers benign LuminaForge SQL

The bundled allow-list SHALL include allowed SQL sufficient for normal LuminaForge demo reads (portfolio, transactions, users, luxury_items) and SHALL NOT include known attack payloads used in the hack simulation script.

#### Scenario: Benign query after init

- **WHEN** default policy is loaded and SQL Monitor is on with block off
- **THEN** documented benign `SELECT` queries against luminaforge schema run without ORA-47605

#### Scenario: Attack query after init

- **WHEN** default policy is loaded and a documented injection/UNION/DELETE attack runs as luminaforge
- **THEN** SQL Firewall records a violation (and blocks only if Block SQL is later enabled)

### Requirement: Button placement in Firewall setup column

Demo Control SHALL expose **Initialize default demo policy** in section **3. Luminaforge — SQL Firewall Control Center**, column **3.3 Firewall setup**, alongside capture and clear-policy controls.

#### Scenario: Presenter locates control

- **WHEN** the user opens Demo Control
- **THEN** **Initialize default demo policy** appears in the **3.3 Firewall setup** column (not in 3.1 or 3.2)
