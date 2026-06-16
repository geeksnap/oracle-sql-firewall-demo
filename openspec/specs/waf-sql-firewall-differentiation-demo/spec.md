# waf-sql-firewall-differentiation-demo Specification

## Purpose
TBD - created by archiving change oci-waf-sql-firewall-differentiation. Update Purpose after archive.
## Requirements
### Requirement: Presenter can demonstrate OCI WAF block vs SQL Firewall detection

The demo environment SHALL document a three-step presenter flow on Attack Point 2 that contrasts (1) OCI WAF blocking the canonical payload on the load-balancer URL, (2) the same UI route accepting an XML/hex obfuscated payload that evades WAF query-string rules, and (3) Oracle SQL Firewall recording violations in Aegis Vault for the bypassed request.

#### Scenario: Canonical payload blocked at WAF edge
- **WHEN** a presenter submits `x' OR user_id<>1 --` via the Transaction History ledger lookup on the WAF URL (`http://<lb_public_ip>/`)
- **THEN** OCI WAF returns HTTP **403** with the configured block response
- **AND** no cross-user `transactions` rows are returned

#### Scenario: XML/hex payload bypasses WAF on the same UI route
- **WHEN** a presenter submits the documented XML/hex `REGEXP_LIKE` / `DBMS_XMLGEN.GETXMLTYPE` / `HEXTORAW` payload via the same ledger lookup on the WAF URL
- **THEN** OCI WAF returns HTTP **200**
- **AND** the API returns `transactions` rows for seeded users other than `user_id = 1` (e.g. 3, 4, 5, 8, 9)

#### Scenario: SQL Firewall still records bypass attempt
- **WHEN** the XML/hex bypass payload executes successfully against the database
- **THEN** Aegis Vault shows a new violation for user `luminaforge` within one poll cycle
- **AND** the presenter can contrast edge allow (WAF) with database-layer detection (SQL Firewall)

### Requirement: Differentiation demo URLs are documented

Documentation SHALL list the three presenter URLs: WAF entry (`<lb_public_ip>`), direct WAF bypass (`<compute_public_ip>:3001`), and Aegis Vault (`<compute_public_ip>:3000`).

#### Scenario: Presenter opens documented URLs
- **WHEN** a presenter follows `terraform/OCI-CONSOLE-QUICKSTART.md` differentiation section
- **THEN** they can run the block → bypass → SOC flow without ad-hoc IP discovery

