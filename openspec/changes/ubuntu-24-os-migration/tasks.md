## 1. Terraform — Compute Image Filter

- [ ] 1.1 In `terraform/compute/main.tf` change `operating_system = "Oracle Linux"` → `"Canonical Ubuntu"` and `operating_system_version = "9"` → `"24.04"`

## 2. cloud-init — Package Manager and Dependencies

- [ ] 2.1 In `terraform/compute/cloud-init.yaml.tftpl`, replace `dnf install -y ...` pre-req block with `apt-get update && apt-get install -y curl git unzip libaio1t64`
- [ ] 2.2 Remove the `oracle-instantclient-release-el9` RPM repo lines and `dnf install -y oracle-instantclient19.31-basic`
- [ ] 2.3 Add Oracle Instant Client 19.31 ZIP installation block: download from `download.oracle.com`, unzip to `/opt/oracle/instantclient_19_31`, run `ldconfig`
- [ ] 2.4 Add `libaio.so.1` symlink: `ln -sf /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1`
- [ ] 2.5 Update `ORACLE_IC_LIB` variable from `/usr/lib/oracle/19.31/client64/lib` to `/opt/oracle/instantclient_19_31` everywhere in cloud-init (env exports, npm build commands, bootstrap.env, systemd units)
- [ ] 2.6 Replace `curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -` + `dnf install -y nodejs` with the Debian/Ubuntu NodeSource path (`setup_22.x` → `apt-get install -y nodejs`)
- [ ] 2.7 Replace `dnf install -y nginx` (WAF redirect block) with `apt-get install -y nginx`

## 3. cloud-init — Firewall

- [ ] 3.1 Remove `if systemctl is-active firewalld` check and `firewall-cmd` calls
- [ ] 3.2 Add `ufw allow 3000/tcp && ufw allow 3001/tcp` after app setup
- [ ] 3.3 Add `ufw allow 80/tcp` in the WAF redirect block (conditional on `WAF_LB_URL`)
- [ ] 3.4 Add `ufw --force enable` to ensure ufw is active without blocking SSH

## 4. Legacy Setup Script

- [ ] 4.1 In `scripts/setup-waf-port80-redirect.sh`, replace `dnf install -y nginx` with `apt-get install -y nginx`
- [ ] 4.2 Replace `firewalld`/`firewall-cmd` lines with `ufw allow 80/tcp && ufw --force enable`
- [ ] 4.3 Update the header comment to reference Ubuntu 24.04

## 5. Documentation — terraform/README.md

- [ ] 5.1 Update OS section to reference Ubuntu 24.04 LTS (remove all Oracle Linux / OL9 references)
- [ ] 5.2 Replace "Installs Oracle Instant Client 19.31 via RPM" with "via ZIP" and note `/opt/oracle/instantclient_19_31`
- [ ] 5.3 Replace all `firewalld` / `firewall-cmd` references with `ufw` equivalents in troubleshooting and cloud-init description
- [ ] 5.4 Replace `dnf` references with `apt` in any listed bootstrap steps
- [ ] 5.5 Update the NJS-533 / thick-mode troubleshooting note to reflect the new Instant Client path

## 6. Documentation — terraform/OCI-CONSOLE-QUICKSTART.md

- [ ] 6.1 Update OS section to reference Ubuntu 24.04 LTS (remove all Oracle Linux / OL9 references)
- [ ] 6.2 Replace "Oracle Instant Client 19.31 via RPM / el9 repo" with "ZIP install to `/opt/oracle/instantclient_19_31`"
- [ ] 6.3 Replace all `firewalld` / `firewall-cmd` references with `ufw` equivalents
- [ ] 6.4 Replace `dnf` references with `apt` in bootstrap narrative and troubleshooting table rows
- [ ] 6.5 Update firewall troubleshooting table entry to show `sudo ufw allow 3000/tcp …` command
