# db-thin-mode-sqlnet Specification

## Purpose
OCI Base Database for this demo accepts unencrypted TCP :1521 so node-oracledb Thin Mode can connect. sqlnet.ora is configured during stack provision without a laptop hop and without the DB VM fetching GitHub.

## Requirements

### Requirement: sqlnet.ora allows Thin Mode before bootstrap
The demo deploy SHALL set `SQLNET.ENCRYPTION_SERVER=ACCEPTED` and `SQLNET.CRYPTO_CHECKSUM_SERVER=ACCEPTED` on the DB home `sqlnet.ora` and reload the listener before `scripts/oci-bootstrap-database.mjs` runs.

#### Scenario: First-boot bootstrap does not hit NNE
- **WHEN** a new DB + compute pair is Applied from the published Resource Manager zips of the same release
- **THEN** `/var/log/sqlfw-install.log` SHALL NOT contain `NJS-533` or `ORA-12660`
- **AND** bootstrap SHALL reach SYS on `host:1521/service` without Instant Client

### Requirement: DB VM never fetches GitHub
No Resource Manager zip, cloud-init script, or deployment doc SHALL instruct the DB host to `curl` (or otherwise download) `raw.githubusercontent.com` or any other public internet URL.

#### Scenario: Recovery does not curl from DB
- **WHEN** a presenter must repair sqlnet on an already-applied stack
- **THEN** the documented command pipes `scripts/configure-db-sqlnet-for-thin-mode.sh` from the compute clone (or the laptop) over SSH to `opc@<db-fqdn> sudo bash -s`
- **AND** that command SHALL NOT run `curl` on the DB host

#### Scenario: Cloud-init has no GitHub fallback
- **WHEN** compute cannot SSH to the DB node or the cloned sqlnet script is missing
- **THEN** cloud-init SHALL fail with a clear log line
- **AND** it SHALL NOT fall back to downloading the script onto the DB VM

### Requirement: Compute can SSH to the DB node for sqlnet
The DB stack security list SHALL allow TCP 22 from `compute_subnet_cidr` in addition to `allow_ssh_cidr`. The DB stack SHALL install a Terraform-generated bootstrap public key on the DB node; the compute stack SHALL use the matching private key from DB remote state only for this sqlnet step.

#### Scenario: allow_ssh_cidr is a laptop /32
- **WHEN** `allow_ssh_cidr` is the presenter’s public IP `/32`
- **THEN** compute cloud-init can still SSH to `opc` on the DB FQDN and apply the sqlnet script

#### Scenario: Presenter key is not the bootstrap key
- **WHEN** the DB stack is Applied
- **THEN** `ssh_public_keys` SHALL include both the presenter `ssh_public_key` and the generated bootstrap public key
- **AND** the presenter private key SHALL NOT appear in Terraform, zips, or compute metadata

### Requirement: DB subnet stays without public internet
The DB stack SHALL NOT add a NAT gateway or a default `0.0.0.0/0` route on the DB subnet route table so the DB VM can fetch GitHub.

#### Scenario: DB route table has no NAT
- **WHEN** the published DB zip is Applied
- **THEN** the DB subnet remains `prohibit_public_ip_on_vnic = true`
- **AND** `db_rt` has no NAT gateway and no internet-gateway default route

### Requirement: Bootstrap private key is not a zip secret
Published stack zips SHALL NOT contain the bootstrap private key as a file. It MAY exist only as a Terraform **sensitive** output consumed via DB remote state and as compute instance user_data, matching the existing `sys_password` trust model.

#### Scenario: Packaged zips exclude private keys
- **WHEN** `sqlfw-db-stack.zip` and `sqlfw-compute-stack.zip` are built
- **THEN** the archives SHALL NOT contain PEM/OpenSSH private key files
- **AND** Resource Manager `schema.yaml` SHALL NOT ask the user to paste a bootstrap private key
