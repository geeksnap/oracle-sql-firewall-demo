## Context

The compute stack today uses Oracle Linux 9 (OL9) as the image OS. All package operations use `dnf`/RPM, Oracle Instant Client is installed via the `oracle-instantclient-release-el9` yum repo, and the firewall is managed by `firewalld`. The Terraform image data source hard-codes `Oracle Linux` / `9` as the OS filter.

Ubuntu 24.04 LTS ("Noble Numbat") uses `apt`/dpkg, does **not** ship the `libaio1` package that Oracle Instant Client requires (it was replaced by `libaio1t64`), and uses `ufw` for firewall management. These differences require targeted substitutions throughout `cloud-init.yaml.tftpl` and supporting scripts — no application code changes are needed.

## Goals / Non-Goals

**Goals:**
- Compute VM boots Ubuntu 24.04 LTS on OCI.
- Oracle Instant Client 19.31 installs cleanly via ZIP + `libaio1t64` symlink.
- Ports 3000, 3001, 80 open via `ufw` instead of `firewalld`.
- Node.js 22 installs via NodeSource `setup_22.x` + `apt`.
- nginx WAF redirect installs via `apt-get` instead of `dnf`.
- All deployment docs (`terraform/README.md`, `terraform/OCI-CONSOLE-QUICKSTART.md`) updated to reference Ubuntu 24.04 terminology.

**Non-Goals:**
- Changing Oracle DB, PDB, or SQL Firewall configuration.
- Modifying application source code (`aegis-vault/`, `luminaforge/`).
- Supporting both OL9 and Ubuntu 24.04 simultaneously.
- Upgrading Oracle Instant Client beyond 19.31 (node-oracledb thick mode is version-agnostic at 19+).

## Decisions

### 1. Oracle Instant Client installation: ZIP vs. apt repo

OCI ships no Oracle Instant Client apt repo. Options:
- **ZIP download** from `download.oracle.com` (no auth needed for basic package) into `/opt/oracle/instantclient_19_31` → `ldconfig` → symlink `libaio.so.1`. **Chosen.**
- Alien RPM → deb conversion: fragile, not idempotent.
- Custom PPA: maintenance burden, not needed for a pinned 19.31 version.

The ZIP approach mirrors what Oracle's own documentation recommends for non-OL Linux and has been validated on Ubuntu 24.04 by the community.

### 2. libaio workaround

Ubuntu 24.04 ships `libaio1t64` providing `libaio.so.1t64`, but Oracle Instant Client requires `libaio.so.1`. The symlink:

```bash
ln -sf /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1
```

is the accepted workaround per Oracle Forums and AskUbuntu. **Chosen** — no recompile required.

### 3. Firewall: ufw instead of firewalld

Ubuntu 24.04 ships `ufw` (active by default on OCI Ubuntu images). `firewalld` is not installed. Replacing all `firewalld` / `firewall-cmd` calls with `ufw allow` is the standard Ubuntu path.

```bash
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw allow 80/tcp
```

`ufw` may already be enabled; `ufw allow` is idempotent.

### 4. Image filter path in Terraform

`oci_core_images` data source filter changes:
- `operating_system` → `"Canonical Ubuntu"`
- `operating_system_version` → `"24.04"`

OCI provides the official Canonical Ubuntu marketplace image. Sort by `TIMECREATED DESC` already in place — picks the latest patch automatically.

### 5. Instant Client path change

OL9 RPM installs to `/usr/lib/oracle/19.31/client64/lib`. ZIP installs to `/opt/oracle/instantclient_19_31`.

All references to `ORACLE_CLIENT_LIBDIR` and `LD_LIBRARY_PATH` (cloud-init env, systemd unit files, bootstrap.env) update to `/opt/oracle/instantclient_19_31`.

## Risks / Trade-offs

- **[Risk] OCI Ubuntu image name differs by region** → Use `operating_system = "Canonical Ubuntu"` and `operating_system_version = "24.04"` — OCI normalises these across regions for Canonical images.
- **[Risk] download.oracle.com ZIP URL changes** → Pin to `instantclient-basic-linux.x64-19.31.0.0.0dbru.zip` (stable URL since 2023); if 404, update URL in cloud-init and cloud-init version in docs.
- **[Risk] libaio.so.1 symlink breaks future Ubuntu upgrades** → Acceptable for a demo VM; note in docs that re-running the install script is idempotent.
- **[Risk] ufw is inactive on some OCI Ubuntu images** → Script uses `ufw allow` then `ufw --force enable` to ensure it's active without blocking existing SSH.
- **[Risk] NodeSource `setup_22.x` script works differently on Ubuntu vs. OL9** → Tested: the same `curl | bash` + `apt install nodejs` path is the official Ubuntu method.

## Migration Plan

1. Update `terraform/compute/main.tf` image filter.
2. Rewrite `terraform/compute/cloud-init.yaml.tftpl` install block (apt, ZIP, ufw, nginx).
3. Update `scripts/setup-waf-port80-redirect.sh` (dnf → apt, firewalld → ufw).
4. Update `terraform/README.md` and `terraform/OCI-CONSOLE-QUICKSTART.md` OS/firewall references.
5. Re-package `sqlfw-compute-stack.zip` via `./package-stacks.sh`.
6. Test: deploy fresh compute stack → confirm `[SUCCESS] Apps + DB schema ready`.

**Rollback:** Change `operating_system` back to `Oracle Linux` / `9` and revert cloud-init — both are in version control.

## Open Questions

- None — ZIP path and libaio symlink are confirmed approaches on Ubuntu 24.04.
