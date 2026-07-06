## Why

The demo stack currently targets Oracle Linux 9 (OL9), which requires `dnf`-based package management, `firewalld`, and the Oracle Linux-specific `oracle-instantclient-release-el9` RPM repo. Ubuntu 24.04 LTS is a more widely familiar Linux environment for workshop and conference audiences, and is the standard OCI compute image for Oracle developer teams. Migrating to Ubuntu 24.04 reduces onboarding friction and aligns with OCI best-practice guidance for new deployments.

## What Changes

- **Terraform compute image filter** — `operating_system` / `operating_system_version` changed from `Oracle Linux` / `9` to `Canonical Ubuntu` / `24.04`.
- **cloud-init package management** — replace `dnf` with `apt` throughout `cloud-init.yaml.tftpl`; remove `oracle-instantclient-release-el9` RPM repo; install Oracle Instant Client 19.31 via ZIP from Oracle download, add `libaio1t64` symlink workaround required on Ubuntu 24.04.
- **Firewall management** — replace `firewalld` / `firewall-cmd` with `ufw`; open ports 3000, 3001, and 80.
- **NodeSource Node.js repo** — use Ubuntu/Debian `setup_22.x` script variant (already correct) and `apt` install path.
- **nginx install** (WAF redirect) — replace `dnf install -y nginx` with `apt-get install -y nginx`.
- **`setup-waf-port80-redirect.sh`** — replace `dnf` / `firewalld` lines with `apt` / `ufw`.
- **Deployment docs** — update all references to Oracle Linux, `dnf`, `firewalld`, `rpm`, and `el9` in `terraform/README.md` and `terraform/OCI-CONSOLE-QUICKSTART.md`.
- **`show_config.sh`** — no change needed (already OS-agnostic bash).

## Capabilities

### New Capabilities

- `compute-os-ubuntu`: OCI compute runs Ubuntu 24.04 LTS; cloud-init install sequence uses `apt`, Oracle Instant Client ZIP, `libaio1t64` symlink, and `ufw` firewall.

### Modified Capabilities

*(No existing spec-level user-facing requirements change.)*

## Impact

- `terraform/compute/main.tf` — image query filter
- `terraform/compute/cloud-init.yaml.tftpl` — full package management rewrite
- `scripts/setup-waf-port80-redirect.sh` — `dnf` → `apt`, `firewalld` → `ufw`
- `terraform/README.md` — OS references and firewall troubleshooting steps
- `terraform/OCI-CONSOLE-QUICKSTART.md` — OS references and firewall troubleshooting steps
