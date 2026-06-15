# luminaforge-default-firewall-policy Specification

## Purpose
Demo Control workflow for initializing LuminaForge SQL Firewall allow-list training and manual finalize.

## Requirements

### Requirement: Initialize default LuminaForge demo policy

The system SHALL provide a Demo Control action that **prepares** SQL Firewall capture training for user **luminaforge**: clear existing policy, start capture, seed baseline benign SQL and LuminaForge app session context. The action SHALL **NOT** call `finalize_default_demo_policy`, `GENERATE_ALLOW_LIST`, or enable the allow-list. The presenter SHALL complete training manually via **Stop SQL capture** and **Generate Allow List**.

#### Scenario: Init starts guided capture training

- **WHEN** the user clicks **Initialize default demo policy** in §3.3 Firewall setup and confirms
- **THEN** the backend clears any existing allow-list and capture for luminaforge
- **AND** starts SQL capture for `LUMINAFORGE`
- **AND** runs benign bootstrap SQL and LuminaForge HTTP training (`/api/session`, `/api/portfolio`) while capture is active
- **AND** SQL capture remains **running** after success
- **AND** no allow-list is enabled yet

#### Scenario: Init shows manual next steps

- **WHEN** init-default-policy completes successfully
- **THEN** the UI SHALL display a modal summarizing completed steps 1–4
- **AND** instruct the presenter to use LuminaForge normally, then click **Stop SQL capture**, then **Generate Allow List**

#### Scenario: Default policy declined

- **WHEN** the user cancels the confirmation dialog
- **THEN** no database mutation is performed

#### Scenario: Not available for SOC user

- **WHEN** a client requests `init-default-policy` for scope **aegis**
- **THEN** the API rejects the action (luminaforge-only)

### Requirement: Default allow-list covers benign LuminaForge SQL

After the presenter completes **Generate Allow List** following init-default-policy, the allow-list SHALL include SQL captured during baseline seeding plus any additional benign LuminaForge traffic recorded while capture was active. Default policy initialization SHALL also train the allow-list using **HTTP requests to the running LuminaForge app** so session context (`CLIENT_PROGRAM`, `OS_USER`, `IP_ADDRESS`) from the LuminaForge Node server is captured while SQL capture is active. The allow-list SHALL NOT be treated as complete until **Generate Allow List** succeeds and SHALL NOT include known attack payloads used in the hack simulation script.

#### Scenario: Benign query after manual finalize

- **WHEN** init-default-policy ran, the presenter used LuminaForge normally, and **Generate Allow List** completed with Block SQL off
- **THEN** documented benign `SELECT` queries against luminaforge schema run without ORA-47605

#### Scenario: Attack query after manual finalize

- **WHEN** the allow-list is enabled via **Generate Allow List** and a documented injection/UNION/DELETE attack runs as luminaforge
- **THEN** SQL Firewall records a violation (and blocks only if Block SQL is later enabled)

#### Scenario: Session API SQL included in bootstrap

- **WHEN** default policy init runs benign bootstrap
- **THEN** the allow-list training path SHALL include the navbar session lookup shape (`SELECT username, role FROM users WHERE id = …`)

#### Scenario: App-server context captured during init

- **WHEN** default policy init runs while LuminaForge is reachable at `LUMINAFORGE_BASE_URL`
- **THEN** init SHALL invoke LuminaForge `/api/session` (and `/api/portfolio`) before finalize
- **AND** subsequent LuminaForge nav tab changes SHALL NOT produce Context violation rows under normal demo conditions

#### Scenario: LuminaForge unreachable during init

- **WHEN** default policy init cannot reach LuminaForge HTTP endpoints
- **THEN** init SHALL fail with an actionable error (do not silently finalize a partial allow-list)

### Requirement: Button placement in Firewall setup column

Demo Control SHALL expose **Initialize default demo policy** in section **3. Luminaforge — SQL Firewall Control Center**, column **3.3 Firewall setup**, alongside capture and clear-policy controls.

#### Scenario: Presenter locates control

- **WHEN** the user opens Demo Control
- **THEN** **Initialize default demo policy** appears in the **3.3 Firewall setup** column (not in 3.1 or 3.2)
