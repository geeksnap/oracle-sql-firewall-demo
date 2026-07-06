## Why

The demo stack was originally built on Oracle Linux 9 using `node-oracledb` in **thick mode** — requiring Oracle Instant Client 19.31, `dnf`/RPM package management, `firewalld`, and native binary loading (`initOracleClient()`). This creates unnecessary deployment complexity: workshop participants must provision compute with a large RPM repo, a native C library, and OS-specific tooling. The project workspace standard mandates `oracledb` in **native Thin Mode** (pure JavaScript, no Instant Client).

This change converts the **entire deployment to Ubuntu 24.04 LTS with `node-oracledb` Thin Mode**, treating it as a fresh GitHub deployment — not a migration from OL9. All specs, application code, infrastructure scripts, and documentation are updated to reflect this as the canonical deployment target.

> Supersedes the `ubuntu-24-os-migration` change proposal (which retained thick-mode Instant Client).

## What Changes

- **`aegis-vault/lib/db/pool.ts`** — remove `ensureOracleClient()`, `initOracleClient()`, and `oracleClientLibDir`; thin mode is the default in `oracledb` v6+ when `initOracleClient()` is not called.
- **`luminaforge/src/lib/db/pool.ts`** — same thick-mode removal.
- **`scripts/oci-bootstrap-database.mjs`** — remove `initOracleClient()` call and `clientLibDir` variable.
- **`terraform/compute/main.tf`** — image filter: `Oracle Linux` / `9` → `Canonical Ubuntu` / `24.04`.
- **`terraform/compute/cloud-init.yaml.tftpl`** — full rewrite of install block: `apt` replaces `dnf`; remove all Oracle Instant Client steps; remove `ORACLE_CLIENT_LIBDIR` / `LD_LIBRARY_PATH` everywhere; replace `firewalld` / `firewall-cmd` with `ufw`; remove `ORACLE_CLIENT_LIBDIR` from `sqlfw-bootstrap.env` and systemd unit `Environment=` lines.
- **`scripts/setup-waf-port80-redirect.sh`** — `dnf` → `apt-get`, `firewalld` → `ufw`; update header comment for Ubuntu 24.04.
- **`terraform/README.md`** — full OS + driver update; remove all OL9/thick-mode/Instant Client references; reflect Ubuntu 24.04 + thin mode as the only supported deployment.
- **`terraform/OCI-CONSOLE-QUICKSTART.md`** — same; remove NJS-533 / Instant Client troubleshooting; add thin-mode connection note.

## Capabilities

### New Capabilities

- `compute-ubuntu-thin`: OCI compute runs Ubuntu 24.04 LTS, Node.js apps connect to Oracle PDB using `node-oracledb` thin mode (pure JavaScript), no Instant Client or native library required.

### Modified Capabilities

*(No existing spec-level user-facing requirements change — only the deployment and driver implementation changes.)*

## Impact

- **Application code** (`aegis-vault/lib/db/pool.ts`, `luminaforge/src/lib/db/pool.ts`, `scripts/oci-bootstrap-database.mjs`) — remove thick-mode init.
- **Infrastructure** (`terraform/compute/main.tf`, `terraform/compute/cloud-init.yaml.tftpl`) — OS image + install sequence.
- **Scripts** (`scripts/setup-waf-port80-redirect.sh`) — package manager + firewall.
- **Documentation** (`terraform/README.md`, `terraform/OCI-CONSOLE-QUICKSTART.md`) — OS, driver, and firewall references.
- **No change** to Oracle DB schema SQL scripts, Terraform DB stack, WAF/LB Terraform resources, or `show_config.sh`.
