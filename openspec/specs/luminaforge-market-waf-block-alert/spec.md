# luminaforge-market-waf-block-alert Specification

## Purpose
TBD - created by archiving change market-explorer-waf-alert. Update Purpose after archive.
## Requirements
### Requirement: OCI WAF block surfaces a presenter alert on Market search

When a Market Explorer search request is blocked by OCI WAF (HTTP **403** on the load-balancer URL), the application SHALL display a browser alert informing the user that SQL injection was detected by OCI WAF and blocked.

#### Scenario: Canonical boolean payload blocked on LB

- **WHEN** a presenter submits `' OR '1'='1` via the Market Explorer search on `http://<lb_public_ip>/market`
- **THEN** OCI WAF returns HTTP **403**
- **AND** the browser SHALL show an alert with text equivalent to: "SQL injection detected by OCI WAF and blocked."

#### Scenario: UNION schema payload blocked on LB

- **WHEN** a presenter submits `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --` on the LB URL
- **THEN** OCI WAF returns HTTP **403**
- **AND** the same WAF block alert SHALL be shown

#### Scenario: Benign search does not trigger WAF alert

- **WHEN** a presenter searches a benign term (e.g. `ORCL` or `bond`) on the LB URL
- **THEN** the response is HTTP **200**
- **AND** no WAF block alert SHALL be shown

#### Scenario: Inline error persists after alert

- **WHEN** a WAF block alert is shown for HTTP **403**
- **THEN** the Market Explorer page SHALL also display an inline error message describing the block (e.g. "Blocked by OCI WAF")
- **AND** search results SHALL remain empty for that request

