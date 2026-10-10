## ADDED Requirements

### Requirement: Compute VM uses Ubuntu 24.04 LTS image
The OCI compute Terraform stack SHALL provision compute instances from the official Canonical Ubuntu 24.04 LTS marketplace image. The Terraform data source SHALL filter `operating_system = "Canonical Ubuntu"` and `operating_system_version = "24.04"`, selecting the most recently published image by `TIMECREATED`.

#### Scenario: Fresh compute stack apply uses Ubuntu 24.04
- **WHEN** the compute stack is applied with default variables
- **THEN** the provisioned VM runs Ubuntu 24.04 LTS (confirmed via `lsb_release -a`)

### Requirement: No Oracle Instant Client on compute (Thin Mode)
The cloud-init bootstrap SHALL NOT install Oracle Instant Client (ZIP or RPM). `ORACLE_CLIENT_LIBDIR` and `LD_LIBRARY_PATH` SHALL NOT appear in `/root/sqlfw-bootstrap.env` or systemd unit `Environment=` directives. Apps and bootstrap SHALL use `node-oracledb` Thin Mode.

#### Scenario: Apps connect without Instant Client
- **WHEN** cloud-init completes successfully on Ubuntu 24.04
- **THEN** `aegis-vault` and `luminaforge` connect to the Oracle PDB without Instant Client libraries installed

### Requirement: Firewall managed by ufw on Ubuntu
The cloud-init bootstrap SHALL use `ufw` to open TCP ports 3000 and 3001, and port 80 when WAF redirect is configured. The bootstrap SHALL NOT use `firewalld` or `firewall-cmd`. `ufw` SHALL be enabled if not already active.

#### Scenario: App ports open after bootstrap
- **WHEN** cloud-init completes successfully
- **THEN** `ufw status` shows 3000/tcp and 3001/tcp as ALLOW

#### Scenario: Port 80 when WAF enabled
- **WHEN** `WAF_LB_URL` is set and cloud-init completes
- **THEN** `ufw status` shows 80/tcp as ALLOW

#### Scenario: SSH not blocked by ufw enable
- **WHEN** cloud-init runs `ufw --force enable`
- **THEN** port 22/tcp remains open and SSH access is uninterrupted

### Requirement: Package management uses apt on Ubuntu
All cloud-init package installation steps SHALL use `apt-get` or `apt`. `dnf`, `yum`, and RPM repo operations SHALL NOT appear in the Ubuntu cloud-init template. nginx for the WAF redirect SHALL be installed via `apt-get install -y nginx`.

#### Scenario: Node.js 22 installs via NodeSource and apt
- **WHEN** cloud-init runs the NodeSource setup script
- **THEN** `node --version` returns a `22.x.x` version string

#### Scenario: nginx installs for WAF redirect
- **WHEN** `enable_waf = true` and cloud-init completes
- **THEN** `systemctl is-active nginx` returns `active`

### Requirement: Deployment documentation references Ubuntu 24.04
`terraform/README.md` and `terraform/OCI-CONSOLE-QUICKSTART.md` SHALL reference Ubuntu 24.04 as the compute OS and Thin Mode for DB connectivity. References to Oracle Linux, `dnf`, `firewalld`, and OL9 Instant Client RPM steps SHALL be replaced with Ubuntu 24.04 equivalents (`apt`, `ufw`, Thin Mode).

#### Scenario: Firewall troubleshooting steps show ufw commands
- **WHEN** a presenter follows the firewall troubleshooting section in the docs
- **THEN** the commands shown use `ufw status` and `ufw allow`, not `firewall-cmd`
