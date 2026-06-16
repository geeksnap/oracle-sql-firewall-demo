## ADDED Requirements

### Requirement: Market Explorer supports WAF-bypass demo payload (Attack Point 1 step 1)

Attack Point 1 SHALL document an optional WAF-evasion payload for the boolean bypass (`' OR '1'='1`) using comment obfuscation (`/**/OR/**/`) and/or the same `REGEXP_LIKE` / `DBMS_XMLGEN` / `HEXTORAW` technique used on Attack Point 2, pasteable from the Market Explorer search UI. Canonical step 1–3 recon payloads SHALL remain the primary hints. Steps 2–3 (UNION / `user_tables` / `user_tab_columns`) MAY remain WAF-blocked on the LB URL.

#### Scenario: Canonical boolean bypass unchanged on direct path
- **WHEN** a user submits `' OR '1'='1` on `http://<compute_public_ip>:3001/market`
- **THEN** all `luxury_items` rows are returned as before
- **AND** SQL Firewall violations are recorded for `luminaforge`

#### Scenario: WAF-bypass boolean payload on LB URL
- **WHEN** a presenter submits the documented WAF-bypass payload from the Market UI on `http://<lb_public_ip>/market`
- **THEN** OCI WAF returns **200**
- **AND** all `luxury_items` rows are returned

### Requirement: Custom Statement supports WAF-bypass demo payload (Attack Point 3)

Attack Point 3 SHALL document an optional WAF-evasion payload pasteable from the Tax Institution ID field when Tier B engineering produces a working constant. The canonical `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` payload SHALL remain the primary hint. If no WAF bypass is achievable without code changes, the secondary hint SHALL state that the canonical credential-leak payload is blocked on the LB URL and `:3001` must be used.

#### Scenario: Canonical UNION credential leak unchanged on direct path
- **WHEN** a user submits `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` on `:3001`
- **THEN** user credential rows are returned as before

#### Scenario: WAF-bypass credential payload when engineered
- **WHEN** a presenter submits the documented Attack Point 3 WAF-bypass payload on the LB URL
- **THEN** OCI WAF returns **200**
- **AND** user credential rows are returned (same outcome class as canonical UNION attack)

### Requirement: Bulk Action supports WAF-bypass demo payload (Attack Point 4)

Attack Point 4 SHALL document an optional WAF-evasion payload pasteable from the batch execution note field when Tier B engineering produces a working constant. The canonical `; UPDATE users SET role='admin' WHERE id=1 --` payload SHALL remain the primary hint. If no WAF bypass is achievable, the secondary hint SHALL document WAF blocking and `:3001` fallback.

#### Scenario: Canonical stacked UPDATE unchanged on direct path
- **WHEN** a user submits `; UPDATE users SET role='admin' WHERE id=1 --` on `:3001`
- **THEN** role escalation occurs and `GET /api/session` reflects `role=admin`

#### Scenario: WAF-bypass role escalation when engineered
- **WHEN** a presenter submits the documented Attack Point 4 WAF-bypass payload on the LB URL
- **THEN** OCI WAF returns **200**
- **AND** `GET /api/session` reflects `role=admin` after the attack
