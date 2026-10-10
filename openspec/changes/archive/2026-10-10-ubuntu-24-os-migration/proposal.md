## Why

The demo stack previously targeted Oracle Linux 9 (OL9), which required `dnf`-based package management, `firewalld`, and the Oracle Linux-specific Instant Client RPM repo. Ubuntu 24.04 LTS is a more widely familiar Linux environment for workshop and conference audiences, and is the standard OCI compute image for Oracle developer teams. Migrating to Ubuntu 24.04 reduces onboarding friction and aligns with OCI best-practice guidance for new deployments.

**Supersession note:** Implementation landed together with Thin Mode (`ubuntu-24-thin-client`, archived 2026-07-06). Compute uses `node-oracledb` Thin Mode — **no Oracle Instant Client** is installed. This change’s original Instant Client ZIP plan is obsolete; apt/ufw/Ubuntu image work remains the OS-migration scope and is complete on `main`.

## What Changes

- **Terraform compute image filter** — `operating_system` / `operating_system_version` changed from `Oracle Linux` / `9` to `Canonical Ubuntu` / `24.04`.
- **cloud-init package management** — replace `dnf` with `apt` throughout `cloud-init.yaml.tftpl`; remove Instant Client RPM/ZIP install (Thin Mode — no native client).
- **Firewall management** — replace `firewalld` / `firewall-cmd` with `ufw`; open ports 3000, 3001, and 80 (when WAF enabled).
- **NodeSource Node.js repo** — Ubuntu/Debian `deb.nodesource.com/setup_22.x` + `apt-get install -y nodejs`.
- **nginx install** (WAF redirect) — `apt-get install -y nginx`.
- **`setup-waf-port80-redirect.sh`** — `apt` / `ufw` for Ubuntu 24.04.
- **Deployment docs** — Ubuntu 24.04, `apt`, `ufw`, Thin Mode throughout `terraform/README.md` and `terraform/OCI-CONSOLE-QUICKSTART.md`.

## Capabilities

### New Capabilities

- `compute-os-ubuntu`: OCI compute runs Ubuntu 24.04 LTS; cloud-init uses `apt` and `ufw`; apps connect via Thin Mode (no Instant Client). Canonical capability on main: `openspec/specs/compute-ubuntu-thin/`.

### Modified Capabilities

*(No existing spec-level user-facing requirements change beyond OS/bootstrap.)*

## Impact

- `terraform/compute/main.tf` — image query filter
- `terraform/compute/cloud-init.yaml.tftpl` — apt / ufw / no Instant Client
- `scripts/setup-waf-port80-redirect.sh` — apt / ufw
- `terraform/README.md` / `terraform/OCI-CONSOLE-QUICKSTART.md` — Ubuntu + Thin Mode docs
