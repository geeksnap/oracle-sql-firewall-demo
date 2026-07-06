# Spec: compute-ubuntu-thin

OCI compute runs Ubuntu 24.04 LTS; Node.js apps connect to Oracle PDB using `node-oracledb` Thin Mode (pure JavaScript). No Oracle Instant Client or native library is required on the compute VM.

---

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

---

### Requirement: pool.ts files contain no thick-mode initialization
The `pool.ts` module in each app SHALL NOT contain `initOracleClient`, `oracleClientLibDir`, `oracleClientReady`, or `ensureOracleClient` identifiers.

#### Scenario: No thick-mode symbols in app source
- **WHEN** the repository is searched for `initOracleClient`
- **THEN** no matches are found in `aegis-vault/lib/db/pool.ts` or `luminaforge/src/lib/db/pool.ts`

---

### Requirement: Compute VM uses Ubuntu 24.04 LTS image
The Terraform compute stack SHALL provision the compute instance from the official Canonical Ubuntu 24.04 LTS OCI marketplace image. The data source SHALL filter `operating_system = "Canonical Ubuntu"` and `operating_system_version = "24.04"`.

#### Scenario: VM reports Ubuntu 24.04 after provisioning
- **WHEN** the compute stack is applied and the VM is accessible via SSH
- **THEN** `lsb_release -a` returns `Ubuntu 24.04` and `uname -r` shows a 6.x kernel

---

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

---

### Requirement: No ORACLE_CLIENT_LIBDIR in runtime environment
The systemd service units for `aegis-vault` and `luminaforge` SHALL NOT contain `Environment=ORACLE_CLIENT_LIBDIR=...` or `Environment=LD_LIBRARY_PATH=...` lines. The `/root/sqlfw-bootstrap.env` file SHALL NOT export `ORACLE_CLIENT_LIBDIR` or `LD_LIBRARY_PATH`.

#### Scenario: Systemd units have no Instant Client env vars
- **WHEN** `systemctl cat aegis-vault.service` is run on the compute VM
- **THEN** the output does not contain `ORACLE_CLIENT_LIBDIR` or `LD_LIBRARY_PATH`

---

### Requirement: Deployment documentation targets Ubuntu 24.04
`terraform/README.md` and `terraform/OCI-CONSOLE-QUICKSTART.md` SHALL reference Ubuntu 24.04 LTS as the compute OS and `node-oracledb` Thin Mode as the driver. These documents SHALL NOT contain references to Oracle Linux, OL9, `dnf`, `firewalld`, `rpm`, `el9`, NJS-533, Instant Client, `ORACLE_CLIENT_LIBDIR`, or `LD_LIBRARY_PATH` in any user-facing step or troubleshooting entry.

#### Scenario: Firewall troubleshooting shows ufw commands
- **WHEN** a presenter follows the firewall troubleshooting table
- **THEN** the commands shown are `sudo ufw allow 3000/tcp && sudo ufw allow 3001/tcp && sudo ufw --force enable`

#### Scenario: No thick-mode or OL9 terminology in docs
- **WHEN** the deployment docs are searched for `Oracle Linux`, `firewalld`, `dnf`, or `NJS-533`
- **THEN** no matches are found in user-facing sections
