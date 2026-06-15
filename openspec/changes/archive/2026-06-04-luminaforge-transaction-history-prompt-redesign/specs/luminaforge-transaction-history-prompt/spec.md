## ADDED Requirements

### Requirement: Transaction History exposes a primary ledger lookup prompt
The Transaction History page SHALL display an always-visible, full-width transaction lookup prompt as the main interaction above the results table. The prompt SHALL NOT be hidden behind a collapsible “Advanced Search” drawer.

#### Scenario: Page loads with prominent lookup
- **WHEN** the user navigates to `/transactions`
- **THEN** a ledger lookup input and submit control SHALL be visible without expanding a drawer
- **AND** the page SHALL still show the transaction results table below the prompt

### Requirement: Lookup prompt uses institutional wealth-app copy
The lookup prompt SHALL use copy that suggests searching transaction records by wire reference, transfer type, or counterparty identifier, consistent with a premium wealth platform.

#### Scenario: Prompt labels and placeholder
- **WHEN** the lookup prompt is rendered
- **THEN** it SHALL include a clear title (e.g. “Institutional Transaction Lookup” or “Transaction Ledger Search”)
- **AND** the input placeholder SHALL reference wire reference, transfer type, or similar ledger terminology
- **AND** a presenter demo hint SHALL show the canonical injection payload for Attack Point 2

### Requirement: Search results emphasize cross-user exfiltration
When the backend returns transactions for multiple `user_id` values, the results table SHALL make **User ID** visible so presenters can demonstrate data leaked from other clients.

#### Scenario: Injection shows multiple users
- **WHEN** a successful injection returns rows where `user_id` is not `1`
- **THEN** those rows SHALL appear in the same results table with **User ID** populated
- **AND** the record count SHALL reflect all returned rows

#### Scenario: Benign search stays scoped to demo user
- **WHEN** the user submits a benign filter such as `BUY` or `TRANSFER`
- **THEN** only transactions for `user_id = 1` matching that type SHALL be shown (subject to seeded data)
