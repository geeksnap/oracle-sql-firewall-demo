# Proposal

## Why

OCI Base Database ships Native Network Encryption on TCP :1521. `node-oracledb` Thin Mode cannot complete that handshake (`NJS-533` / `ORA-12660`). The published Resource Manager docs tell presenters to fix this with Option A (Bastion) or Option B (`ssh -A` then `curl -fsSL https://raw.githubusercontent.com/…/configure-db-sqlnet-for-thin-mode.sh | sudo bash` **on the DB VM**). The DB subnet has no NAT and no internet route, so that `curl` hangs. Live hop tests proved compute→DB SSH and a piped clone of the same script succeed; the hang is GitHub from the DB, not SSH. Resource Manager cannot remote-exec into the private DB subnet, and `oci_database_db_system` has no `user_data` / sqlnet argument, so sqlnet never gets set at DB Apply. New compartments therefore still need a laptop hop unless the zips themselves apply the cloned script from compute.

## What Changes

- **DB zip (`sqlfw-db-stack.zip` / `terraform/db`):** allow TCP 22 from `compute_subnet_cidr` in addition to `allow_ssh_cidr`; generate an ED25519 bootstrap key in Terraform and append its public half to `oci_database_db_system.ssh_public_keys` next to the presenter key; expose the private half as a **sensitive** output for the compute stack (same remote-state pattern as `sys_password`). Do **not** add a NAT gateway or internet route on `db_rt`.
- **Compute zip (`sqlfw-compute-stack.zip` / `terraform/compute`):** after the GitHub clone (and after `:1521` is reachable), **before** `scripts/oci-bootstrap-database.mjs`, pipe `scripts/configure-db-sqlnet-for-thin-mode.sh` from the clone over SSH to `opc@<db-fqdn>` using the bootstrap key. Never download that script onto the DB VM from GitHub or any other public URL.
- **Docs:** remove the required Bastion / Option B `curl | sudo bash` happy path from `terraform/OCI-CONSOLE-QUICKSTART.md` Step 2c, `terraform/OCI-QUICK-DEPLOYMENT.md` §12, `terraform/README.md`, and `terraform/DOWNLOAD.md`. Happy path is DB Apply → compute Apply; cloud-init configures sqlnet. Keep a **recovery** pipe (`sudo cat` clone | `ssh opc … sudo bash -s`) for old zips or failed boots. Docs MAY name `NJS-533` / `ORA-12660` as the failure this zip prevents.
- **Publish:** after implementation, cut a **new** RM tag with **both** zips. Do **not** bump `DOWNLOAD.md` in the spec-review commit. Do **not** Apply the new DB zip onto an already-fixed live compartment as a drive-by.
- **BREAKING (ops, not app API):** a compute zip that expects `db_bootstrap_ssh_private_key` will not sqlnet-provision against an older DB stack that never planted the bootstrap public key. Presenters MUST upload **both** new zips (or use recovery on old stacks). App SPECs and Thin Mode runtime are unchanged.

## Capabilities

### New Capabilities

- `db-thin-mode-sqlnet`: OCI Base Database for this demo accepts unencrypted TCP :1521 so Thin Mode can connect. sqlnet.ora is configured during stack provision without a laptop hop and without the DB VM fetching GitHub. Owns DB-side SSH ingress from the compute subnet, the Terraform-generated bootstrap key, and the “never curl from DB” rule.

### Modified Capabilities

- `compute-ubuntu-thin`: cloud-init SHALL apply the cloned sqlnet script on the DB host before bootstrap; the bootstrap scenario requires the listener to accept Thin Mode TCP. Docs MAY mention `NJS-533` / `ORA-12660` as the prevented failure and as recovery for old stacks; they SHALL NOT tell the DB host to curl GitHub.
- `oci-console-terraform-bundle`: Console happy path SHALL NOT require Bastion or Option B (`ssh -A` + curl on the DB) for a successful first-boot. Quickstart / quick-deployment docs SHALL NOT contain `curl -fsSL https://raw.githubusercontent.com/` targeting the DB host.

## Impact

- `terraform/db/main.tf` (db_sl SSH from compute CIDR; `ssh_public_keys`; `tls_private_key`), `terraform/db/versions.tf` (`hashicorp/tls`), `terraform/db/outputs.tf` (sensitive bootstrap private key).
- `terraform/compute/main.tf` (read bootstrap key from DB remote state; pass into cloud-init), `terraform/compute/cloud-init.yaml.tftpl` (openssh-client, write key, pipe cloned script after `:1521` wait, before bootstrap).
- Docs: `terraform/OCI-CONSOLE-QUICKSTART.md`, `terraform/OCI-QUICK-DEPLOYMENT.md`, `terraform/README.md`, `terraform/DOWNLOAD.md` (version bump only at publish, not this spec PR).
- Existing script `scripts/configure-db-sqlnet-for-thin-mode.sh` is reused, not rewritten.
- Out of scope: NAT/IGW on the DB subnet; Destroy/recreate of live DB `161.33.154.45` or the already-unblocked compartment; presenter private keys in git/zips/metadata; `ORA-06550` / `LUMINAFORGE.AEGIS_DEMO_SEED` (separate change); packaging/version bump in the spec-review commit.
