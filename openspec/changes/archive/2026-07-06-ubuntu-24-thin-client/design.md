## Context

The current stack connects to Oracle PDB using `node-oracledb` **thick mode**: both `aegis-vault/lib/db/pool.ts` and `luminaforge/src/lib/db/pool.ts` call `oracledb.initOracleClient({ libDir })`, and `scripts/oci-bootstrap-database.mjs` does the same. This forces a dependency on Oracle Instant Client 19.31 (a native C shared library), the `oracle-instantclient-release-el9` RPM yum repo, `ORACLE_CLIENT_LIBDIR`/`LD_LIBRARY_PATH` env vars across cloud-init, systemd units, and `npm run build`.

In `node-oracledb` **v6+** (the installed version), thin mode is the **default**: if `initOracleClient()` is never called, the driver runs as pure JavaScript with no native binary. Thin mode supports all OCI Base DB connection types including TCPS (port 2484) with wallet-less Easy Connect (`tcps://host:2484/service`). This completely eliminates the native library layer.

The OS change to Ubuntu 24.04 LTS is a clean companion to the thin-mode switch — without Instant Client, there is no `libaio` dependency and no RPM ecosystem. Ubuntu 24.04 uses `apt`, `ufw`, and the standard Canonical images on OCI.

## Goals / Non-Goals

**Goals:**
- `node-oracledb` thin mode in both apps and the bootstrap script (no `initOracleClient()` anywhere).
- Compute VM runs Ubuntu 24.04 LTS via the Canonical OCI image.
- cloud-init uses `apt`, `ufw`, and standard Ubuntu tooling only.
- All documentation reflects Ubuntu 24.04 + thin mode as the **only** supported deployment.
- Fresh-deployment framing: docs assume deploying from GitHub onto a new Ubuntu VM.

**Non-Goals:**
- Side-by-side OL9 compatibility — old thick-mode cloud-init is removed, not wrapped.
- In-place migration guide from an existing OL9 VM (deploy fresh instead).
- Upgrading oracledb package version (stays at current installed version).
- Changing database schema SQL scripts or Terraform DB/WAF stacks.

## Decisions

### 1. Thin mode activation: remove initOracleClient() entirely

`node-oracledb` v6+ activates thin mode automatically when `initOracleClient()` is never called. No configuration flag is needed — deletion is sufficient.

**Impact in each file:**
- `pool.ts` (both apps): delete `oracleClientLibDir` const, `oracleClientReady` flag, `ensureOracleClient()` function, and the `ensureOracleClient()` call in `getPool()`.
- `oci-bootstrap-database.mjs`: delete `clientLibDir` const and the `try { oracledb.initOracleClient() } catch` block.

No connection string format change is needed — thin mode accepts the same Easy Connect syntax `host:port/service`.

### 2. serverExternalPackages stays in next.config.ts

`serverExternalPackages: ["oracledb"]` prevents Next.js webpack from bundling `oracledb`. This is still needed in thin mode: `oracledb` contains conditional `require()` calls that webpack cannot statically analyse. **No change to `next.config.ts`.**

### 3. Ubuntu 24.04 image filter

`oci_core_images` data source filter:
```hcl
operating_system         = "Canonical Ubuntu"
operating_system_version = "24.04"
```
OCI provides official Canonical Ubuntu 24.04 marketplace images in all commercial regions. Sorting by `TIMECREATED DESC` picks the latest patch automatically (already in `main.tf`).

### 4. Package management: apt replaces dnf entirely

No Oracle Instant Client → no Oracle RPM yum repo → no `dnf` needed. The full install block becomes:

```bash
apt-get update
apt-get install -y git curl jq nodejs   # nodejs from NodeSource
```

NodeSource `setup_22.x` script supports Ubuntu 22.04/24.04 via its Debian path.

### 5. Firewall: ufw replaces firewalld

Ubuntu 24.04 ships `ufw`. `firewalld` is not present. All `if systemctl is-active firewalld` guards and `firewall-cmd` calls are replaced with:

```bash
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw --force enable
```

`ufw --force enable` is idempotent and does not block existing SSH (port 22 is allowed by OCI security list and ufw defaults).

### 6. ORACLE_CLIENT_LIBDIR / LD_LIBRARY_PATH removed everywhere

Since thin mode requires no Instant Client:
- Remove from `/root/sqlfw-bootstrap.env` template.
- Remove `Environment=ORACLE_CLIENT_LIBDIR=...` and `Environment=LD_LIBRARY_PATH=...` from both systemd units in `cloud-init.yaml.tftpl`.
- Remove from the `npm ci` / `npm run build` / bootstrap env commands in cloud-init.

### 7. Documentation: Ubuntu 24.04 as sole canonical OS

Both `terraform/README.md` and `terraform/OCI-CONSOLE-QUICKSTART.md` are rewritten to:
- State Ubuntu 24.04 LTS as the compute OS.
- Remove all Oracle Linux, `dnf`, `firewalld`, `rpm`, `el9`, `OL9` references.
- Remove NJS-533, thick-mode, and Instant Client troubleshooting entries.
- Add a thin-mode note: "node-oracledb connects in pure-JavaScript Thin Mode — no Oracle Client software required on the VM."
- Firewall troubleshooting uses `ufw status` / `ufw allow` commands.

## Risks / Trade-offs

- **[Risk] Thin mode TLS requirement** → OCI Base DB on TCPS (port 2484) with wallet-less Easy Connect works in thin mode without a wallet when the DB is configured with `ssl_server_dn_match=FALSE` or when the Easy Connect string includes the right SSL options. If the existing `DB_CONNECTION_STRING` uses port 1521 (TCP), thin mode works without any extra config. Mitigation: document both port 1521 and 2484 connection strings; no code change needed.
- **[Risk] Pool ping behavior differs in thin mode** → `oracledb.poolPingInterval = 0` (already set in luminaforge) disables application-level pings. Thin mode uses protocol-level keepalives instead; behaviour is equivalent. No change needed.
- **[Risk] `serverExternalPackages` not present triggers webpack bundling error** → Kept unchanged, so no risk.
- **[Risk] OCI Ubuntu image may differ slightly between regions** → Using `operating_system = "Canonical Ubuntu"` + `operating_system_version = "24.04"` is normalized by OCI across all commercial regions.

## Migration Plan

This is a fresh deployment change — existing OL9 VMs are replaced, not upgraded.

1. Apply application code changes (`pool.ts` × 2, `oci-bootstrap-database.mjs`).
2. Update `terraform/compute/main.tf` image filter.
3. Rewrite `cloud-init.yaml.tftpl` install block.
4. Update `scripts/setup-waf-port80-redirect.sh`.
5. Update `terraform/README.md` and `OCI-CONSOLE-QUICKSTART.md`.
6. Destroy old compute instance (Terraform `destroy` or Resource Manager stack destroy).
7. Deploy fresh: `terraform apply` (or Resource Manager stack apply) → Ubuntu 24.04 VM + thin-mode apps.

**Rollback:** Revert git commits. Thin mode is fully backward compatible with the same `DB_CONNECTION_STRING` values.

## Open Questions

- None. Thin mode on Ubuntu 24.04 with port 1521 TCP Easy Connect is fully validated for OCI Base DB.
