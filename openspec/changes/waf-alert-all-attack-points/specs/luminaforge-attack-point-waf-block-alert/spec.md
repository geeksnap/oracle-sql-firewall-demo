## ADDED Requirements

### Requirement: Shared OCI WAF block alert on Attack Points 2–4

When an attack-point request on Transaction History, Custom Statement, or Bulk Action is blocked by OCI WAF (HTTP **403** on the load-balancer URL), the application SHALL display the same browser alert used on Market Explorer: SQL injection detected by OCI WAF and blocked.

#### Scenario: Transaction History canonical payload blocked on LB

- **WHEN** a presenter submits `x' OR user_id<>1 --` via the ledger lookup on `http://<lb_public_ip>/transactions`
- **THEN** OCI WAF returns HTTP **403**
- **AND** the browser SHALL show an alert with text equivalent to: "SQL injection detected by OCI WAF and blocked."
- **AND** an inline error describing the WAF block SHALL be shown on the page

#### Scenario: Custom Statement UNION payload blocked on LB

- **WHEN** a presenter submits `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` on `http://<lb_public_ip>/statement`
- **THEN** OCI WAF returns HTTP **403**
- **AND** the same WAF block alert SHALL be shown
- **AND** statement results SHALL remain empty for that request

#### Scenario: Bulk Action stacked UPDATE blocked on LB

- **WHEN** a presenter submits `; UPDATE users SET role='admin' WHERE id=1 --` on `http://<lb_public_ip>/bulk`
- **THEN** OCI WAF returns HTTP **403**
- **AND** the same WAF block alert SHALL be shown
- **AND** bulk execution success UI SHALL NOT be shown

#### Scenario: Benign requests do not trigger WAF alert

- **WHEN** a presenter submits a benign value on any Attack Point 2–4 screen on the LB URL (e.g. `TRANSFER`, tax ID `1`, benign batch note)
- **THEN** the response is HTTP **200** (or application success without **403**)
- **AND** no WAF block alert SHALL be shown

### Requirement: Shared WAF alert helper across attack screens

The application SHALL centralize OCI WAF block alert text and **403** detection in a shared client module consumed by all four attack-point fetch handlers.

#### Scenario: Consistent alert message

- **WHEN** any attack-point screen receives HTTP **403** from OCI WAF
- **THEN** the alert text SHALL match the Market Explorer WAF block message exactly

#### Scenario: Direct path bypasses WAF without alert

- **WHEN** the same canonical payload is submitted on `http://<compute_public_ip>:3001` for any attack point
- **THEN** HTTP **200** attack outcomes remain available where documented
- **AND** no OCI WAF block alert is shown
