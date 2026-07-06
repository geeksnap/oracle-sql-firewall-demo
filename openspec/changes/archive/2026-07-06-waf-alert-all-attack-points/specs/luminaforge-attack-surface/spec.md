## ADDED Requirements

### Requirement: Attack Point inputs use plain fixed text fields where payloads are entered

Attack Point 2 (Transaction History ledger reference), Attack Point 3 (Tax Institution ID), and Attack Point 4 (Batch Execution Note) SHALL use single-line plain text inputs for the primary attack payload field, matching the Market Explorer pattern. Browser autocomplete SHALL be disabled on those fields.

#### Scenario: Bulk Action attack input is single-line

- **WHEN** the user views the Bulk Action batch execution note field
- **THEN** the control SHALL be a single-line `<input type="text">` (not a `<textarea>`)
- **AND** the field SHALL include `autoComplete="off"`

#### Scenario: Transaction and Statement attack inputs disable autocomplete

- **WHEN** the user views the Transaction History ledger lookup or Custom Statement tax ID field
- **THEN** each attack input SHALL include `autoComplete="off"`
- **AND** neither field SHALL use `<datalist>` or application suggestion dropdowns tied to the attack input

### Requirement: Attack Points 2–4 surface OCI WAF block via alert

Attack Points 2, 3, and 4 SHALL invoke a browser alert when their respective API routes return HTTP **403** from OCI WAF on the load-balancer URL, in addition to existing inline error handling, so presenters can contrast edge blocking with SQL Firewall detection on the direct `:3001` path.

#### Scenario: Attack Point 2 WAF alert on LB

- **WHEN** a presenter submits a canonical SQL injection payload blocked by OCI WAF on `http://<lb_public_ip>/transactions`
- **THEN** HTTP **403** is returned
- **AND** a browser alert states that SQL injection was detected by OCI WAF and blocked

#### Scenario: Attack Point 3 WAF alert on LB

- **WHEN** a presenter submits the canonical credential-leak UNION payload on `http://<lb_public_ip>/statement`
- **THEN** HTTP **403** is returned
- **AND** the same WAF block alert is shown

#### Scenario: Attack Point 4 WAF alert on LB

- **WHEN** a presenter submits the canonical stacked UPDATE payload on `http://<lb_public_ip>/bulk`
- **THEN** HTTP **403** is returned
- **AND** the same WAF block alert is shown
