## ADDED Requirements

### Requirement: Market Explorer surfaces OCI WAF block via alert (Attack Point 1)

Attack Point 1 on the Market Explorer page SHALL, in addition to existing search error handling, invoke a browser alert when `POST /api/market/search` returns HTTP **403** from OCI WAF on the load-balancer URL, so presenters can contrast edge blocking with SQL Firewall detection on the direct `:3001` path.

#### Scenario: WAF block alert on LB URL

- **WHEN** a presenter submits a canonical SQL injection payload blocked by OCI WAF (e.g. `' OR '1'='1`) on `http://<lb_public_ip>/market`
- **THEN** HTTP **403** is returned
- **AND** a browser alert states that SQL injection was detected by OCI WAF and blocked

#### Scenario: Direct path bypasses WAF without alert

- **WHEN** the same payload is submitted on `http://<compute_public_ip>:3001/market`
- **THEN** HTTP **200** is returned with attack results
- **AND** no OCI WAF block alert is shown
- **AND** SQL Firewall violations are recorded for user `luminaforge` as before
