# compute-ubuntu-thin Specification

## Purpose
OCI compute runs Ubuntu 24.04 LTS; Node.js apps connect to Oracle PDB using `node-oracledb` Thin Mode (pure JavaScript). No Oracle Instant Client or native library is required on the compute VM.

## Requirements

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

### Requirement: pool.ts files contain no thick-mode initialization
The `pool.ts` module in each app SHALL NOT contain `initOracleClient`, `oracleClientLibDir`, `oracleClientReady`, or `ensureOracleClient` identifiers.

#### Scenario: No thick-mode symbols in app source
- **WHEN** the repository is searched for `initOracleClient`
- **THEN** no matches are found in `aegis-vault/lib/db/pool.ts` or `luminaforge/src/lib/db/pool.ts`

### Requirement: Compute VM uses Ubuntu 24.04 LTS image
The Terraform compute stack SHALL provision the compute instance from the official Canonical Ubuntu 24.04 LTS OCI marketplace image. The data source SHALL filter `operating_system = "Canonical Ubuntu"` and `operating_system_version = "24.04"`.

#### Scenario: VM reports Ubuntu 24.04 after provisioning
- **WHEN** the compute stack is applied and the VM is accessible via SSH
- **THEN** `lsb_release -a` returns `Ubuntu 24.04` and `uname -r` shows a 6.x kernel

### Requirement: cloud-init uses apt and ufw only
The `cloud-init.yaml.tftpl` install script SHALL use `apt-get` for all package operations. `dnf`, `yum`, and `rpm` SHALL NOT appear anywhere in cloud-init. The script SHALL NOT install or reference Oracle Instant Client. Firewall operations SHALL use `ufw allow` and `ufw --force enable`. `firewalld` and `firewall-cmd` SHALL NOT appear in cloud-init.

#### Scenario: Packages install via apt on fresh VM
- **WHEN** cloud-init runs on a new Ubuntu 24.04 compute instance
- **THEN** `/var/log/sqlfw-install.log` contains no `dnf` or `firewall-cmd` errors, and `which apt-get` confirms the package manager

#### Scenario: App ports open via ufw
- **WHEN** cloud-init completes successfully
- **THEN** `sudo ufw status` lists `3000/tcp ALLOW` and `3001/tcp ALLOW`

#### Scenario: Port 80 opened via ufw when WAF enabled
- **WHEN** `enable_waf = true` and cloud-init completes
- **THEN** `sudo ufw status` lists `80/tcp ALLOW`

### Requirement: No ORACLE_CLIENT_LIBDIR in runtime environment
The systemd service units for `aegis-vault` and `luminaforge` SHALL NOT contain `Environment=ORACLE_CLIENT_LIBDIR=...` or `Environment=LD_LIBRARY_PATH=...` lines. The `/root/sqlfw-bootstrap.env` file SHALL NOT export `ORACLE_CLIENT_LIBDIR` or `LD_LIBRARY_PATH`.

#### Scenario: Systemd units have no Instant Client env vars
- **WHEN** `systemctl cat aegis-vault.service` is run on the compute VM
- **THEN** the output does not contain `ORACLE_CLIENT_LIBDIR` or `LD_LIBRARY_PATH`

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

### Requirement: Bootstrap expands SQL*Plus includes before execute
`scripts/oci-bootstrap-database.mjs` SHALL expand every SQL*Plus `@@relative/path.sql` include relative to the calling script before splitting or executing statements. It SHALL fail if an include file is missing or an `@@` line remains unresolved. It SHALL NOT skip `@@` lines.

#### Scenario: Setup creates AEGIS_DEMO_SEED before initialize
- **WHEN** bootstrap executes `Oracle_DB_Setup.sql`
- **THEN** it loads `sql/luminaforge_demo_seed.sql` (CREATE PACKAGE / PACKAGE BODY `luminaforge.aegis_demo_seed`)
- **AND** `luminaforge.aegis_demo_seed.initialize(...)` runs only after that package exists

#### Scenario: Demo Control includes are not silently dropped
- **WHEN** bootstrap executes `Oracle_DB_Demo_Control_Grant.sql`
- **THEN** it also loads `sql/luminaforge_bootstrap_benign.sql`, `sql/luminaforge_demo_seed_identity_migration.sql`, `sql/luminaforge_demo_seed.sql`, and `sql/luminaforge_reinit_transactions.sql`

#### Scenario: Missing include fails bootstrap
- **WHEN** a bootstrap SQL file references `@@` a path that does not exist on disk
- **THEN** bootstrap exits non-zero with an error that names the missing include
- **AND** it does not continue to a later `aegis_demo_seed.initialize` call

### Requirement: cloud-init applies Thin Mode sqlnet from the clone
After the GitHub clone succeeds and the DB listener port is reachable, and before `oci-bootstrap-database.mjs`, cloud-init SHALL apply `scripts/configure-db-sqlnet-for-thin-mode.sh` on the DB host using the cloned file. It SHALL NOT download that script from the internet onto the DB VM.

#### Scenario: Clone path is the script source
- **WHEN** cloud-init reaches the sqlnet step
- **THEN** the script bytes come from `/home/<app_user>/apps/oracle-sql-firewall-demo/scripts/configure-db-sqlnet-for-thin-mode.sh`
- **AND** `/var/log/sqlfw-install.log` contains `[SUCCESS] sqlnet.ora updated — thin-mode clients can connect on TCP :1521` (or a clear failure) before bootstrap starts
