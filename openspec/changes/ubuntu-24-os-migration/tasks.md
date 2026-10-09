## 1. Terraform — Compute Image Filter

- [x] 1.1 In `terraform/compute/main.tf` change `operating_system = "Oracle Linux"` → `"Canonical Ubuntu"` and `operating_system_version = "9"` → `"24.04"`

## 2. cloud-init — Package Manager and Dependencies

- [x] 2.1 In `terraform/compute/cloud-init.yaml.tftpl`, replace `dnf install -y ...` pre-req block with apt (`packages:` / `apt-get`); Thin Mode — no `libaio1t64` / Instant Client deps
- [x] 2.2 Remove the `oracle-instantclient-release-el9` RPM repo lines and `dnf install -y oracle-instantclient19.31-basic`
- [x] 2.3 Do **not** install Instant Client ZIP (superseded by Thin Mode — no `/opt/oracle/instantclient_*`)
- [x] 2.4 Do **not** add `libaio.so.1` symlink (not needed without Instant Client)
- [x] 2.5 Ensure no `ORACLE_IC_LIB` / `ORACLE_CLIENT_LIBDIR` / `LD_LIBRARY_PATH` in cloud-init (env, bootstrap.env, systemd units)
- [x] 2.6 Replace `curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -` + `dnf install -y nodejs` with the Debian/Ubuntu NodeSource path (`deb.nodesource.com/setup_22.x` → `apt-get install -y nodejs`)
- [x] 2.7 Replace `dnf install -y nginx` (WAF redirect block) with `apt-get install -y nginx`

## 3. cloud-init — Firewall

- [x] 3.1 Remove `if systemctl is-active firewalld` check and `firewall-cmd` calls
- [x] 3.2 Add `ufw allow 3000/tcp && ufw allow 3001/tcp` after app setup
- [x] 3.3 Add `ufw allow 80/tcp` in the WAF redirect block (conditional on `WAF_LB_URL`)
- [x] 3.4 Add `ufw --force enable` to ensure ufw is active without blocking SSH

## 4. Legacy Setup Script

- [x] 4.1 In `scripts/setup-waf-port80-redirect.sh`, replace `dnf install -y nginx` with `apt-get install -y nginx`
- [x] 4.2 Replace `firewalld`/`firewall-cmd` lines with `ufw allow 80/tcp && ufw --force enable`
- [x] 4.3 Update the header comment to reference Ubuntu 24.04

## 5. Documentation — terraform/README.md

- [x] 5.1 Update OS section to reference Ubuntu 24.04 LTS (remove all Oracle Linux / OL9 references); Compute SSH user `ubuntu` (not `opc`)
- [x] 5.2 Document Thin Mode — no Oracle Instant Client on the VM (not ZIP/RPM install)
- [x] 5.3 Replace all `firewalld` / `firewall-cmd` references with `ufw` equivalents in troubleshooting and cloud-init description
- [x] 5.4 Replace `dnf` references with `apt` in any listed bootstrap steps
- [x] 5.5 NJS-533 troubleshooting reflects Thin Mode + DB sqlnet/NNE (not Instant Client path)

## 6. Documentation — terraform/OCI-CONSOLE-QUICKSTART.md

- [x] 6.1 Update OS section to reference Ubuntu 24.04 LTS (remove all Oracle Linux / OL9 references)
- [x] 6.2 Document Thin Mode — no Instant Client ZIP/RPM on compute
- [x] 6.3 Replace all `firewalld` / `firewall-cmd` references with `ufw` equivalents
- [x] 6.4 Replace `dnf` references with `apt` in bootstrap narrative and troubleshooting table rows
- [x] 6.5 Update firewall troubleshooting table entry to show `sudo ufw allow 3000/tcp …` command
