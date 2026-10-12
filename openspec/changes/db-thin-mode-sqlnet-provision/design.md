# Design

## Context

See proposal.md — Why. Current `main` (`fae2452`, tag `orm-stacks-20261012`):

- `terraform/db/main.tf`: DB subnet `prohibit_public_ip_on_vnic = true`; `db_rt` has **only** a Service Gateway rule (OSN). **No NAT, no IGW default.** `db_sl` allows TCP **1521** from `compute_subnet_cidr` and TCP **22** from `allow_ssh_cidr` only. `oci_database_db_system.sqlfw.ssh_public_keys = [var.ssh_public_key]`. No `user_data`, no sqlnet argument.
- `terraform/db/versions.tf`: `oracle/oci` only — no `hashicorp/tls`.
- Compute already reads DB remote state (`db_stack_id` → `oci_resourcemanager_stack_tf_state` / local `db_state_path`) for `sys_password`, `app_db_password`, `db_connection_string`. Passwords are base64-injected into `/root/sqlfw-bootstrap.env`.
- `cloud-init.yaml.tftpl` order today: NodeSource → `git clone` → wait `:1521` → `npm ci`/`build` → `node scripts/oci-bootstrap-database.mjs`. Packages: `git`, `curl`, `jq`, `ufw` — no `openssh-client`.
- Live proof (do not re-apply sqlnet; do not touch `161.33.154.45`): hop + `sudo cat` clone `| ssh opc sudo bash -s` succeeds in ~1.6s; documented Option B `curl` on the DB hangs (no NAT). `lsnrctl reload` needs the listener; TCP `:1521` being open is independent of NNE.

`oci_database_db_system` cannot write `sqlnet.ora` at DB Apply. Resource Manager cannot `remote-exec` into the private DB subnet. The only provision-time path that can edit the file is **compute cloud-init → SSH to opc@DB**.

## Goals / Non-Goals

**Goals:**

- Plant compute→DB SSH (security list + bootstrap key) in the DB zip.
- Apply the **cloned** sqlnet script from compute before bootstrap, with no GitHub on the DB.
- Rewrite Console docs so first-boot needs no Bastion / Option B curl.
- Keep the DB private (SGW-only `db_rt`).

**Non-Goals:**

- NAT / IGW on the DB subnet so the DB can curl GitHub.
- Applying the new DB zip onto the live demo (`161.33.154.45`) or the already-unblocked compartment as a drive-by.
- Destroy/recreate of any existing DB.
- Rewriting `scripts/configure-db-sqlnet-for-thin-mode.sh`.
- `ORA-06550` / `LUMINAFORGE.AEGIS_DEMO_SEED` (separate change).
- Packaging zips or bumping `DOWNLOAD.md` in the **spec-review** commit (those are apply + publish tasks).
- Presenter private keys in git, zips, or instance metadata.
- New Resource Manager Console variables for the bootstrap key.

## Decisions

### 1) Generate the bootstrap key in the DB stack, not compute

**Choice:** `tls_private_key` (ED25519) in `terraform/db`. Append `tls_private_key.db_bootstrap.public_key_openssh` to `oci_database_db_system.sqlfw.ssh_public_keys` beside `var.ssh_public_key`. Output `db_bootstrap_ssh_private_key` as **sensitive**. Compute reads it via existing DB remote state (same as `sys_password`).

**Rationale:** Only the DB resource can install authorized keys on the Base DB node at provision time. Generating the key where `ssh_public_keys` is set avoids a second API to mutate the DB system after it exists.

**Alternatives considered:**

| Alternative | Why not |
|-------------|---------|
| Generate key in compute; update DB `ssh_public_keys` later | Requires DB-system update (often disruptive); RM job for compute cannot rely on that finishing first |
| Presenter key + `ssh-agent` forwarding in cloud-init | Cloud-init has no laptop agent; empty-agent was a live failure mode |
| Put presenter private key in compute metadata | Forbidden (secrets in git/zips/metadata) |
| OCI Run Command on the DB node | Not available for Base DB today; do not block the zip on it |

### 2) Pipe the clone after `:1521` is up, before bootstrap

**Choice:** In `sqlfw-install-apps.sh` (inside `cloud-init.yaml.tftpl`): `git clone` → existing `:1521` wait loop → write `/root/.ssh/db_bootstrap` (`chmod 600`) →

```bash
cat "$REPO_DIR/scripts/configure-db-sqlnet-for-thin-mode.sh" \
  | ssh -i /root/.ssh/db_bootstrap -o BatchMode=yes -o ConnectTimeout=15 \
      -o StrictHostKeyChecking=no "opc@$HOST" "sudo bash -s"
```

→ existing `npm ci` / bootstrap. Add `openssh-client` to cloud-init `packages`. Pass the private key into `templatefile` as base64 (same YAML-safe pattern as `sys_password_b64`). Fail the install if SSH or the script exits non-zero; **no curl fallback**.

**Rationale (vs analysis “after clone, then wait”):** the script runs `lsnrctl reload`. Waiting on TCP `:1521` first is the proven listener-ready signal; NNE does not block that TCP probe. Piping from the clone is the live-working command (`sudo cat` was only needed because `ubuntu` cannot read `odb_sec`’s tree; cloud-init runs as root).

**Alternatives considered:**

| Alternative | Why not |
|-------------|---------|
| Pipe before the `:1521` wait | `lsnrctl reload` can fail while the DB is still coming up |
| `curl` from compute (not DB) of raw.githubusercontent.com | Extra network dependency; clone is already the source of truth for `github_branch` |
| Bastion as happy path | Same `curl` on the DB; hangs the same way |

### 3) Extra DB SSH ingress from `compute_subnet_cidr`; do not add NAT

**Choice:** New `db_sl` ingress: TCP 22, source `var.compute_subnet_cidr`, in **addition to** `allow_ssh_cidr`. Leave `db_rt` SGW-only. Leave the existing `0.0.0.0/0` **egress** rule on `db_sl` (it does not create a route; removing it is unrelated hardening).

**Rationale:** Default `allow_ssh_cidr` is `0.0.0.0/0`, so live SSH worked; the latent zip bug is presenter `/32`. NAT would make Option B curl “work” and keep GitHub on a private DB — rejected.

### 4) Docs: automatic happy path; pipe-from-clone recovery only

**Choice:** Rewrite Step 2c / §12 as “compute cloud-init applies sqlnet; no laptop hop.” Delete both `curl -fsSL https://raw.githubusercontent.com/… | sudo bash` blocks (Option A and B). Recovery subsection: `sudo cat` of the compute clone `| ssh opc … sudo bash -s`, plus `ssh-add` if using the presenter key through `-A`. `DOWNLOAD.md` version bump happens **only** when the new tag is published (apply task), not in spec review.

**Rationale:** Matches the live working command. `compute-ubuntu-thin` currently forbids mentioning `NJS-533`; this change **replaces** that so troubleshooting can name the error the zip prevents.

### 5) Matched zip pair; do not Apply onto the live compartment

**Choice:** Both zips from one new tag. Compute that expects `db_bootstrap_ssh_private_key` against an older DB stack fails at Plan (missing output) or at SSH — that is acceptable. Do not Apply the new DB zip onto a sqlnet-already-fixed VM just to plant the key.

**Rationale:** Changing `ssh_public_keys` / security lists in-place is possible but out of scope for the already-unblocked compartment and forbidden for `161.33.154.45`.

## Risks / Trade-offs

- **[Risk] Bootstrap private key in compute `user_data` / RM state** → Same trust model as `sys_password` already in `/root/sqlfw-bootstrap.env`. Sensitive output; `chmod 600`; never a zip file or schema field. Presenter key stays off the VM.
- **[Risk] `opc` sudo password prompt hangs cloud-init** → Live piped script ran `sudo bash -s` + `lsnrctl reload` with no prompt. Keep `BatchMode=yes` and a ConnectTimeout so a prompt fails fast.
- **[Risk] New compute zip + old DB zip** → Terraform Plan fails on missing output, or SSH `Permission denied`. Docs: upload **both** zips; recovery pipe for old stacks.
- **[Risk] Host key unknown** → `StrictHostKeyChecking=no` for this first-boot provision only (already used in documented hop).
- **[Risk] `ubuntu` vs `odb_sec` file permissions on recovery** → Document `sudo cat` of the clone; cloud-init itself is root and does not need sudo cat.

## Migration Plan

1. Human reviews this OpenSpec change (this PR). **No code, no zip, no DOWNLOAD bump yet.**
2. `/opsx:apply` (or equivalent) implements Terraform + docs on a follow-up PR.
3. `terraform/package-stacks.sh` → new GitHub tag with **both** zips → point `DOWNLOAD.md` at that tag.
4. Consumers: **new empty compartment** (or new stacks). Do not Destroy the live DB. Do not Apply as a drive-by onto `161.33.154.45`.
5. Rollback: keep using `orm-stacks-20261012` + recovery pipe; do not re-introduce curl-from-DB.

## Open Questions

None — live hop already chose pipe-from-clone over curl-from-DB; `oci_database_db_system` constraints are confirmed in `terraform/db/main.tf`.
