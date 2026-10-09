## Context

The compute stack previously used Oracle Linux 9 (OL9). Package operations used `dnf`/RPM, Instant Client came from the `oracle-instantclient-release-el9` yum repo, and the firewall was `firewalld`.

Ubuntu 24.04 LTS uses `apt`/dpkg and `ufw`. Separately, the stack moved to **node-oracledb Thin Mode**, so Instant Client (ZIP or RPM) and `libaio` workarounds are **not** required. Canonical design for that pairing: archived change `ubuntu-24-thin-client`.

## Goals / Non-Goals

**Goals:**
- Compute VM boots Ubuntu 24.04 LTS on OCI.
- Ports 3000, 3001, and 80 (when WAF enabled) open via `ufw`.
- Node.js 22 installs via NodeSource `setup_22.x` + `apt`.
- nginx WAF redirect installs via `apt-get`.
- Deployment docs reference Ubuntu 24.04 + Thin Mode.

**Non-Goals:**
- Changing Oracle DB, PDB, or SQL Firewall configuration.
- Modifying application source beyond Thin Mode (already done).
- Supporting both OL9 and Ubuntu 24.04 simultaneously.
- Installing Oracle Instant Client on compute (Thin Mode).

## Decisions

### 1. Instant Client: not installed (Thin Mode)

Original plan used ZIP + `libaio1t64` symlink for thick mode. **Superseded:** apps and bootstrap use Thin Mode only — no Instant Client path, `ORACLE_CLIENT_LIBDIR`, or `LD_LIBRARY_PATH`.

### 2. Firewall: ufw instead of firewalld

```bash
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw --force enable
# when WAF_LB_URL set:
ufw allow 80/tcp
```

OCI Ubuntu images may ship a legacy iptables REJECT before ufw; cloud-init removes that rule so app ports are reachable.

### 3. Image filter

- `operating_system` → `"Canonical Ubuntu"`
- `operating_system_version` → `"24.04"`

### 4. Package management: apt only

`dnf` / RPM repos removed. Pre-reqs via cloud-config `packages:` + NodeSource deb path.

## Risks / Trade-offs

- **[Risk] ufw inactive / OCI iptables REJECT** → `ufw --force enable` plus removal of legacy REJECT in `rules.v4` (already in cloud-init).
- **[Risk] Thin Mode vs NNE on Base DB** → `scripts/configure-db-sqlnet-for-thin-mode.sh` + docs (NJS-533 / ORA-12660).

## Migration Plan

1. Image filter → Canonical Ubuntu 24.04 — **done on main**.
2. cloud-init apt / ufw / no Instant Client — **done on main**.
3. `setup-waf-port80-redirect.sh` — **done on main**.
4. Docs — **done on main** (minor SSH-user table fix in this apply).
5. Mark this change’s tasks complete; archive via `/opsx:archive`.

**Rollback:** Revert to Oracle Linux / thick mode only via git history (not supported as a dual path).

## Open Questions

- None — Ubuntu + Thin Mode is live on `main`.
