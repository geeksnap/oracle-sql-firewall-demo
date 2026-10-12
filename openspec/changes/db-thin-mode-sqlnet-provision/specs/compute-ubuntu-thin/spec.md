# Spec Delta

## ADDED Requirements

### Requirement: cloud-init applies Thin Mode sqlnet from the clone
After the GitHub clone succeeds and the DB listener port is reachable, and before `oci-bootstrap-database.mjs`, cloud-init SHALL apply `scripts/configure-db-sqlnet-for-thin-mode.sh` on the DB host using the cloned file. It SHALL NOT download that script from the internet onto the DB VM.

#### Scenario: Clone path is the script source
- **WHEN** cloud-init reaches the sqlnet step
- **THEN** the script bytes come from `/home/<app_user>/apps/oracle-sql-firewall-demo/scripts/configure-db-sqlnet-for-thin-mode.sh`
- **AND** `/var/log/sqlfw-install.log` contains `[SUCCESS] sqlnet.ora updated — thin-mode clients can connect on TCP :1521` (or a clear failure) before bootstrap starts

## MODIFIED Requirements

### Requirement: node-oracledb runs in Thin Mode
Both `aegis-vault` and `luminaforge` SHALL connect to the Oracle PDB using `node-oracledb` native Thin Mode. Neither app SHALL call `oracledb.initOracleClient()`. No Oracle Instant Client or native shared library SHALL be installed on the compute VM or referenced in any environment variable, systemd unit, or build command.

#### Scenario: Aegis Vault connects in thin mode
- **WHEN** the `aegis-vault` service starts on the compute VM
- **THEN** it connects to the Oracle PDB without `ORACLE_CLIENT_LIBDIR` or `LD_LIBRARY_PATH` set, and without NJS-533 or DPI-1047 errors in the service log

#### Scenario: LuminaForge connects in thin mode
- **WHEN** the `luminaforge` service starts on the compute VM
- **THEN** it connects to the Oracle PDB without `ORACLE_CLIENT_LIBDIR` or `LD_LIBRARY_PATH` set, and without NJS-533 or DPI-1047 errors in the service log

#### Scenario: Bootstrap script connects in thin mode
- **WHEN** `scripts/oci-bootstrap-database.mjs` is executed during cloud-init
- **THEN** it connects as SYS to the Oracle PDB, executes all bootstrap SQL, and exits 0 without requiring Instant Client libraries
- **AND** the DB listener accepts Thin Mode TCP (`SQLNET.ENCRYPTION_SERVER=ACCEPTED`) so the connection does not fail with NJS-533 or ORA-12660

### Requirement: Deployment documentation targets Ubuntu 24.04
`terraform/README.md` and `terraform/OCI-CONSOLE-QUICKSTART.md` SHALL reference Ubuntu 24.04 LTS as the compute OS and `node-oracledb` Thin Mode as the driver. These documents SHALL NOT contain references to Oracle Linux, OL9, `dnf`, `firewalld`, `rpm`, `el9`, Instant Client, `ORACLE_CLIENT_LIBDIR`, or `LD_LIBRARY_PATH` in any user-facing step or troubleshooting entry. Docs MAY mention `NJS-533` / `ORA-12660` as the failure the published zip prevents and as recovery for **old** stacks. Docs SHALL NOT instruct the DB host to curl GitHub.

#### Scenario: Firewall troubleshooting shows ufw commands
- **WHEN** a presenter follows the firewall troubleshooting table
- **THEN** the commands shown are `sudo ufw allow 3000/tcp && sudo ufw allow 3001/tcp && sudo ufw --force enable`

#### Scenario: No thick-mode or OL9 terminology in docs
- **WHEN** the deployment docs are searched for `Oracle Linux`, `firewalld`, or `dnf`
- **THEN** no matches are found in user-facing sections

#### Scenario: NJS-533 is recovery language only
- **WHEN** the deployment docs mention `NJS-533` or `ORA-12660`
- **THEN** the text describes automatic sqlnet provision and/or a pipe-from-clone recovery
- **AND** it SHALL NOT tell the DB host to `curl` `raw.githubusercontent.com`
