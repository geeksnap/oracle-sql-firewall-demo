## MODIFIED Requirements

### Requirement: Default allow-list covers benign LuminaForge SQL

The bundled allow-list SHALL include allowed SQL sufficient for normal LuminaForge demo reads (portfolio, transactions, users, luxury_items) and SHALL NOT include known attack payloads used in the hack simulation script. Default policy initialization SHALL also train the allow-list using **HTTP requests to the running LuminaForge app** so session context (`CLIENT_PROGRAM`, `OS_USER`, `IP_ADDRESS`) from the LuminaForge Node server is captured while SQL capture is active.

#### Scenario: Benign query after init

- **WHEN** default policy is loaded and SQL Monitor is on with block off
- **THEN** documented benign `SELECT` queries against luminaforge schema run without ORA-47605

#### Scenario: Attack query after init

- **WHEN** default policy is loaded and a documented injection/UNION/DELETE attack runs as luminaforge
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
