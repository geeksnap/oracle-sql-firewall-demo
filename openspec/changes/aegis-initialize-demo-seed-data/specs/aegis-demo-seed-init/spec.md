## Purpose

Presenter-facing control to wipe and reload LuminaForge demo seed tables with timestamps relative to the current database time, without re-running full schema setup.

## ADDED Requirements

### Requirement: Command Nav exposes Initialize Demo Seed Data under Break-Glass Control

The Aegis Vault Command Nav footer SHALL show an action control labeled **Initialize Demo Seed Data** directly beneath the **Break-Glass Control** navigational button. The control SHALL NOT be a third navigable Command Nav section (it SHALL NOT switch the main content to a new nav section by itself).

#### Scenario: Button appears under Break-Glass Control

- **WHEN** the presenter views Command Nav
- **THEN** **Initialize Demo Seed Data** SHALL appear immediately under **Break-Glass Control**
- **AND** navigable sections remain only **Dashboard** and **Break-Glass Control**

#### Scenario: Confirm before destructive reload

- **WHEN** the presenter activates **Initialize Demo Seed Data** with a valid break-glass grant
- **THEN** the UI SHALL require an explicit confirmation that demo table data will be deleted and reseeded
- **AND** canceling the confirmation SHALL leave database data unchanged

### Requirement: Seed init deletes and reloads LuminaForge demo tables

Activating **Initialize Demo Seed Data** (after confirm) SHALL restore LuminaForge demo application tables to the seeded baseline used by `Oracle_DB_Setup.sql` / `luminaforge/scripts/reset-demo-data.sql` for: `users` (roles and seeded passwords), `portfolio`, `transactions`, and `luxury_items`. Existing rows that conflict with that baseline SHALL be removed or replaced so post-attack residue (including `BULK` transaction rows and escalated roles) does not remain.

#### Scenario: Full demo baseline restored

- **WHEN** **Initialize Demo Seed Data** completes successfully after attack demos that changed roles, portfolios, market rows, or ledger rows
- **THEN** `users` SHALL match the seeded roster roles and passwords from the shared reset/seed scripts
- **AND** `portfolio` and `luxury_items` SHALL match the seeded demo baseline
- **AND** `transactions` SHALL match the seeded demo baseline with no leftover `BULK` rows

#### Scenario: Transaction timestamps are relative to now

- **WHEN** **Initialize Demo Seed Data** reloads `transactions`
- **THEN** seeded transaction timestamps SHALL be expressed relative to current database time (e.g. `SYSTIMESTAMP - INTERVAL 'N' DAY` offsets from the seed script)
- **AND** a benign “last 30 days” LuminaForge transaction lookup SHALL return the expected demo-user rows for the current calendar window

### Requirement: Seed init executes via whitelisted demo control

**Initialize Demo Seed Data** SHALL invoke a whitelisted `SYS.aegis_demo_control` procedure through existing `POST /api/demo-control/execute` with a dedicated action id (e.g. `initialize-demo-seed-data`). The client SHALL NOT send free-form SQL or invent new secrets; seed credentials SHALL come only from existing setup/reset SQL already in the repository.

#### Scenario: Demo control executes seed procedure

- **WHEN** the presenter confirms **Initialize Demo Seed Data**
- **THEN** Aegis Vault SHALL call the whitelisted initialize-demo-seed procedure via `POST /api/demo-control/execute`
- **AND** the Break-Glass / Demo Control output console SHALL display the executed SQL stub and returned status message on success or error

#### Scenario: Narrow transaction reinit remains available

- **WHEN** the presenter opens Break-Glass §3.3 Firewall setup
- **THEN** **Reinitialize default transaction data** SHALL remain available for transaction-only loops
- **AND** **Initialize Demo Seed Data** SHALL remain the fuller multi-table seed path from Command Nav
