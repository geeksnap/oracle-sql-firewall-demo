## ADDED Requirements

### Requirement: Transaction History supports XML/hex WAF-bypass demo payload

Attack Point 2 SHALL document an optional XML/hex obfuscation payload using Oracle `REGEXP_LIKE`, `DBMS_XMLGEN.GETXMLTYPE`, `utl_raw.cast_to_varchar2`, and `HEXTORAW`, pasteable from the Transaction History ledger lookup UI, that evades OCI WAF query-string rules while still executing via the existing `POST /api/transactions/filter` concatenation. The canonical payload `x' OR user_id<>1 --` SHALL remain the primary demo hint and SHALL retain its documented behavior on the direct `:3001` path.

#### Scenario: Canonical Attack Point 2 payload unchanged on direct path
- **WHEN** a user submits `x' OR user_id<>1 --` on `http://<compute_public_ip>:3001/transactions`
- **THEN** cross-user `transactions` rows are returned as before
- **AND** SQL Firewall violations are recorded for `luminaforge`

#### Scenario: XML/hex payload available as secondary UI hint
- **WHEN** a presenter views the Transaction History ledger lookup
- **THEN** a secondary monospace hint displays the complete XML/hex WAF-bypass payload constant
- **AND** the primary hint still shows `x' OR user_id<>1 --`

#### Scenario: XML/hex payload does not alter vulnerable SQL template
- **WHEN** any payload is submitted to `POST /api/transactions/filter`
- **THEN** `filterTransactions` still builds SQL only via the existing `type = '${ref}'` string concatenation with no server-side decoding or special cases
