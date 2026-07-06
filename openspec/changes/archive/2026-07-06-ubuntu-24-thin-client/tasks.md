## 1. Application Code — Remove Thick-Mode Init

- [x] 1.1 In `aegis-vault/lib/db/pool.ts`: delete `oracleClientLibDir` const, `oracleClientReady` flag, `ensureOracleClient()` function, and the `ensureOracleClient()` call inside `getPool()`
- [x] 1.2 In `luminaforge/src/lib/db/pool.ts`: delete the same thick-mode symbols (`oracleClientLibDir`, `oracleClientReady`, `ensureOracleClient()`, and its call in `getPool()`)
- [x] 1.3 In `scripts/oci-bootstrap-database.mjs`: delete `clientLibDir` const and the `try { oracledb.initOracleClient() } catch` block (lines ~24–31)
- [x] 1.4 Verify no remaining calls to `initOracleClient` exist anywhere in the repo (`rg initOracleClient` returns zero results)

## 2. Terraform — Compute Image Filter

- [x] 2.1 In `terraform/compute/main.tf`: change `operating_system = "Oracle Linux"` → `"Canonical Ubuntu"` and `operating_system_version = "9"` → `"24.04"`

## 3. cloud-init — Remove Instant Client and Thick-Mode Env

- [x] 3.1 In `terraform/compute/cloud-init.yaml.tftpl` `write_files` block for `/root/sqlfw-bootstrap.env`: remove `export ORACLE_CLIENT_LIBDIR=...` and `export LD_LIBRARY_PATH=...` lines
- [x] 3.2 Remove the `ORACLE_IC_LIB` variable assignment and the Oracle Instant Client install block (`dnf install -y oracle-instantclient-release-el9`, `dnf install -y oracle-instantclient19.31-basic`, `ldconfig`)
- [x] 3.3 Remove `ORACLE_CLIENT_LIBDIR` and `LD_LIBRARY_PATH` from `npm ci` and `npm run build` env lines
- [x] 3.4 Remove `ORACLE_CLIENT_LIBDIR` and `LD_LIBRARY_PATH` from the `node scripts/oci-bootstrap-database.mjs` `env` block
- [x] 3.5 In the `aegis-vault.service` systemd unit block: remove `Environment=ORACLE_CLIENT_LIBDIR=...` and `Environment=LD_LIBRARY_PATH=...` lines
- [x] 3.6 In the `luminaforge.service` systemd unit block: remove the same two `Environment=` lines

## 4. cloud-init — Package Manager: apt replaces dnf

- [x] 4.1 Replace the `packages:` block top-level cloud-config and any `dnf install` pre-req with `apt-get update && apt-get install -y git curl jq`
- [x] 4.2 Replace `curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && dnf install -y nodejs` with the Ubuntu NodeSource path: `curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs`

## 5. cloud-init — Firewall: ufw replaces firewalld

- [x] 5.1 Remove the `if systemctl is-active firewalld` guard block and `firewall-cmd --permanent --add-port=3000/tcp` / `3001/tcp` / `--reload` lines
- [x] 5.2 Add `ufw allow 3000/tcp && ufw allow 3001/tcp && ufw --force enable` after app services start
- [x] 5.3 In the WAF redirect block: replace `if systemctl is-active firewalld ... firewall-cmd --add-port=80/tcp` with `ufw allow 80/tcp`
- [x] 5.4 Replace `dnf install -y nginx` (WAF redirect block) with `apt-get install -y nginx`

## 6. Legacy Setup Script — setup-waf-port80-redirect.sh

- [x] 6.1 Replace `dnf install -y nginx` with `apt-get install -y nginx`
- [x] 6.2 Replace `if systemctl is-active firewalld ... firewall-cmd` block with `ufw allow 80/tcp && ufw --force enable`
- [x] 6.3 Update header comment: reference Ubuntu 24.04; note this is a manual fallback for VMs where cloud-init WAF redirect was not configured

## 7. Documentation — terraform/README.md

- [x] 7.1 Update OS description to `Ubuntu 24.04 LTS` (remove all Oracle Linux / OL9 / el9 references)
- [x] 7.2 Replace "Installs Oracle Instant Client 19.31 (thick mode)" with "Connects via node-oracledb Thin Mode — no Oracle Client software required"
- [x] 7.3 Remove `ORACLE_CLIENT_LIBDIR` and `LD_LIBRARY_PATH` from all listed env vars and bootstrap commands
- [x] 7.4 Replace `firewalld` / `firewall-cmd` troubleshooting steps with `ufw` equivalents
- [x] 7.5 Replace `dnf` references with `apt` in bootstrap narrative
- [x] 7.6 Remove NJS-533 / thick-mode / Instant Client troubleshooting table rows; add thin-mode connection note
- [x] 7.7 Update re-run bootstrap command (no `ORACLE_CLIENT_LIBDIR` env needed)

## 8. Documentation — terraform/OCI-CONSOLE-QUICKSTART.md

- [x] 8.1 Update OS description to `Ubuntu 24.04 LTS` (remove all Oracle Linux / OL9 references)
- [x] 8.2 Replace Instant Client install note with thin-mode note
- [x] 8.3 Remove `ORACLE_CLIENT_LIBDIR` / `LD_LIBRARY_PATH` from all env var lists
- [x] 8.4 Replace `firewalld` / `firewall-cmd` troubleshooting commands with `ufw` equivalents
- [x] 8.5 Replace `dnf` references with `apt` in all steps
- [x] 8.6 Remove NJS-533 / thick-mode / NJS-045 troubleshooting rows from tables
- [x] 8.7 Update the cloud-init "what it does" checklist item to "Opens ufw ports 3000/3001 (+ 80 when WAF enabled)"
