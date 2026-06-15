## MODIFIED Requirements

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

## MODIFIED Requirements

### Requirement: Default allow-list covers benign LuminaForge SQL

After the presenter completes **Generate Allow List** following init-default-policy, the allow-list SHALL include SQL captured during baseline seeding plus any additional benign LuminaForge traffic recorded while capture was active. The allow-list SHALL NOT be treated as complete until **Generate Allow List** succeeds.

#### Scenario: Benign query after manual finalize

- **WHEN** init-default-policy ran, the presenter used LuminaForge normally, and **Generate Allow List** completed with Block SQL off
- **THEN** documented benign `SELECT` queries against luminaforge schema run without ORA-47605

#### Scenario: Attack query after manual finalize

- **WHEN** the allow-list is enabled via **Generate Allow List** and a documented injection/UNION/DELETE attack runs as luminaforge
- **THEN** SQL Firewall records a violation (and blocks only if Block SQL is later enabled)
