# OCI Console Quickstart — SQL Firewall Demo

**One page.** Deploy entirely from **OCI Console → Developer Services → Resource Manager**. No local `terraform apply`.

| Time | ~15 min prep + **60–90 min** DB Apply job + **10–20 min** cloud-init after compute Apply |
|------|-------------------------------------------------------------------------------------------|

```text
Browser → Compute VM (:3000 Aegis, :3001 LuminaForge) → Base DB 26ai (PDB)
         └── private VCN (created by DB stack — do not pre-create)
```

Full reference: [`README.md`](../README.md) · Start/stop apps + DB: [`README.md`](../README.md#startstop) · Local CLI: [`README.md#phase-0--oci-api-access-one-time`](README.md)

---

## Networking — VCN is included (do not use VCN Wizard)

The **DB stack creates the entire network** automatically. You do **not** need a separate VCN step.

| Resource | Created by DB stack | Default CIDR |
|----------|---------------------|--------------|
| VCN | `sqlfw-demo-vcn` | `10.40.0.0/16` |
| Compute subnet (public IP) | `sqlfw-demo-compute-subnet` | `10.40.0.0/24` |
| DB subnet (private) | `sqlfw-demo-db-subnet` | `10.40.1.0/24` |
| Internet gateway + route tables | yes | — |
| **Service gateway** | yes — DB subnet → Object Storage (required for Base DB) | — |
| Security lists | yes — **1521** (compute→DB), **22/3000/3001** (`allow_ssh_cidr`) | — |
| **firewalld on compute VM** | cloud-init opens **3000/3001** (OCI rules alone are not enough) | — |

**Do not** use **Networking → Virtual Cloud Networks → VCN Wizard** before deploying. A wizard VCN will not be used by this Terraform and will cause confusion (wrong subnets, missing rules for ports 3000/3001 and 1521).

**Only if** `10.40.0.0/16` overlaps an existing VCN in the same compartment, change these optional DB stack variables before Apply:

```hcl
vcn_cidr             = "10.50.0.0/16"
compute_subnet_cidr  = "10.50.0.0/24"
db_subnet_cidr       = "10.50.1.0/24"
```

Otherwise leave defaults — no networking prep required.

### Two-layer firewall (ports 3000 / 3001)

Browser access to the apps requires **both** layers to allow your IP:

| Layer | Where | What to set |
|-------|--------|-------------|
| **OCI security list** | DB stack variable `allow_ssh_cidr` | Your public IP `/32`, or `0.0.0.0/0` for open demos |
| **firewalld on VM** | cloud-init (automatic on new VMs) | Opens TCP 3000 and 3001 |

Changing `allow_ssh_cidr` in the Console **Variables** tab does nothing until you run **Plan → Apply** on the **DB stack**.  
If HTTP returns `000` or connection refused but SSH works, check firewalld on the VM:

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'sudo firewall-cmd --list-ports'
# expect: 3000/tcp 3001/tcp
```

---

## What compute cloud-init installs

After the compute stack Apply succeeds, cloud-init on the VM (~**10–20 min**):

1. Opens **firewalld** ports 3000 / 3001
2. Installs **Oracle Instant Client 19.31** (thick mode — required for OCI Base DB; thin mode fails **NJS-533**)
3. Installs **Node.js 22**, clones GitHub, waits for DB listener on port 1521
4. Runs `npm ci` + `npm run build` for both apps (with `ORACLE_CLIENT_LIBDIR` / `LD_LIBRARY_PATH`)
5. Runs `scripts/oci-bootstrap-database.mjs` (schema, users, demo packages)
6. Starts **systemd** services `aegis-vault` (:3000) and `luminaforge` (:3001)

**Repo on GitHub must include** (push to `main` before deploy):

- `scripts/oci-bootstrap-database.mjs`
- `serverExternalPackages: ["oracledb"]` in both `next.config.ts` files
- Thick-mode pool init in `aegis-vault/lib/db/pool.ts` and `luminaforge/src/lib/db/pool.ts`

---

## Before you start

| Need | Action |
|------|--------|
| **Console region** | Select target region (top-right) — must match `region` variable in both stacks |
| OCI compartment OCID | **Identity → Compartments** → Copy OCID (used as `compartment_id` variable) |
| SSH key | `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_sqlfw -N ""` → `cat ~/.ssh/id_ed25519_sqlfw.pub` |
| 26ai DB version | **Base Database → Create** → note version, or `oci db version list --compartment-id <ocid>` |
| Your public IP | `allow_ssh_cidr = "x.x.x.x/32"` on **DB stack** — must **Apply** after change (opens SSH + **3000/3001**) |
| **GitHub repo** | **Push latest `main`** — compute VM clones GitHub (zip has no app code). **Public repo** = no PAT |
| IAM — resources | `manage database-family`, `instance-family`, `virtual-network-family` in target compartment |
| IAM — Resource Manager | `manage orm-stacks`, `manage orm-jobs` (or `manage stacks` / `manage jobs`) in compartment where stacks live |
| **VCN / networking** | **Nothing to create manually** — DB stack provisions VCN + subnets (see [Networking](#networking--vcn-is-included-do-not-use-vcn-wizard)) |

---

## Step 1 — Build zip files (on laptop, once)

Clone or pull latest repo, then:

```bash
cd terraform
chmod +x package-stacks.sh   # first time only
./package-stacks.sh
# or: bash package-stacks.sh
```

Produces (gitignored — do not commit):

| Zip | Order |
|-----|-------|
| `terraform/sqlfw-db-stack.zip` | Upload **first** |
| `terraform/sqlfw-compute-stack.zip` | Upload **second** |

Each zip has `.tf` files at the **root** (no `.terraform/`, no `terraform.tfvars`).

---

## Step 2 — DB stack (Resource Manager)

**Console:** **Developer Services → Resource Manager → Stacks → Create stack**

| Wizard step | Choice |
|-------------|--------|
| Configuration source | **My configuration** → **.Zip file** → `sqlfw-db-stack.zip` |
| Stack compartment | Compartment to store the stack object (often same as demo compartment) |
| Terraform version | **1.5+** (match `required_version` in zip) |
| Stack name | e.g. `sqlfw-db` |

**Variables** (Configure variables panel — names must match exactly):

```hcl
region          = "ap-singapore-1"              # same as Console region
compartment_id  = "ocid1.compartment.oc1....."  # where VCN + DB are created
ssh_public_key  = "ssh-ed25519 AAAA... sqlfw"   # full single-line .pub
db_home_version = "26.0.0.0.0"                  # ap-tokyo-1 26ai — use exact string from error/Console
allow_ssh_cidr  = "YOUR.PUBLIC.IP/32"   # or "0.0.0.0/0" for open demos — Apply required after change
pdb_name        = "SQLFWPDB1"
project_prefix  = "sqlfw-demo"
# Do NOT set sys_password to pdb_name. Defaults (no # — safe in RM Variables UI):
# sys_password    = "DbAdm12_Ab-cdXy"   (no 'sys' or 'Oracle' in password)
# app_db_password = "AppDb34_Cd-efGh"
```

**Passwords:** Hardcoded in the zip. **Delete** `sys_password` / `app_db_password` from Variables to use defaults:

| Variable | Default |
|----------|---------|
| `sys_password` | `"DbAdm12_Ab-cdXy"` |
| `app_db_password` | `"AppDb34_Cd-efGh"` |

OCI rejects passwords containing **`Oracle`** or **`sys`** (SYS admin password).

**Run jobs:** **Plan** → review → **Apply**. The plan should show a **new VCN**, two subnets, security lists, and a Base DB system. The Apply job blocks until Base DB provisioning finishes (~**60–90 min**). Wait for job status **Succeeded**.

**Optional cross-check:** **Oracle Base Database** → DB system lifecycle **AVAILABLE**.

**Stack → Outputs** (save for troubleshooting):

| Output | Notes |
|--------|--------|
| `db_connection_string` | Easy Connect for apps |
| `pdb_name` | e.g. `SQLFWPDB1` |
| `sys_password` | Sensitive — show in Console |
| `app_db_password` | Sensitive — show in Console |

**Copy Stack OCID** (Stack details → Stack information) — required for Step 3.

---

## Step 2b — GitHub repo URL (public or private)

Cloud-init runs `git clone` as user `odb_sec` on the compute VM.

### Public repo (no token — simplest)

1. On GitHub: **Repository → Settings → General → Danger Zone → Change repository visibility → Public**
2. Push your latest code to `main`
3. In compute stack variables:

```hcl
github_repo_url = "https://github.com/geeksnap/oracle-sql-firewall-demo.git"
github_branch   = "main"
```

No PAT required. Skip the rest of this section.

### Private repo (PAT required)

A **private** repo needs a **Personal Access Token (PAT)** embedded in `github_repo_url`.

### Create a fine-grained token (recommended)

1. Log in to **GitHub** → **Profile photo** → **Settings**
2. **Developer settings** (left sidebar, bottom) → **Personal access tokens** → **Fine-grained tokens**
3. **Generate new token**
4. **Token name:** e.g. `oci-sqlfw-demo-read`
5. **Expiration:** 90 days (or your policy)
6. **Resource owner:** your account (`geeksnap`)
7. **Repository access:** **Only select repositories** → choose **`oracle-sql-firewall-demo`**
8. **Permissions → Repository permissions:**
   - **Contents:** **Read-only**
   - (Leave everything else **No access**)
9. **Generate token** → copy the token **once** (starts with `github_pat_...`)

### Set in compute stack Variables

Replace `<TOKEN>` with the copied value (no spaces):

```hcl
github_repo_url = "https://github_pat_XXXXXXXXXXXXXXXXXXXX@github.com/geeksnap/oracle-sql-firewall-demo.git"
```

**Alternative format** (also works):

```hcl
github_repo_url = "https://geeksnap:github_pat_XXXXXXXXXXXXXXXXXXXX@github.com/geeksnap/oracle-sql-firewall-demo.git"
```

Mark **`github_repo_url` as sensitive** in Resource Manager if the UI offers it. **Never commit** the token to git.

### Classic token (fallback)

1. **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. **Generate new token (classic)** → note e.g. `oci-sqlfw-demo`
3. Scope: **`repo`** (Full control of private repositories) — or minimum read-only scopes your org allows
4. Generate and copy (starts with `ghp_...`)

```hcl
github_repo_url = "https://ghp_XXXXXXXXXXXXXXXXXXXX@github.com/geeksnap/oracle-sql-firewall-demo.git"
```

### After updating the token or making the repo public

Saving a variable in Resource Manager does **not** re-run cloud-init. Either:

**A — Re-run bootstrap on existing VM** (faster):

```bash
COMPUTE_IP=<compute_public_ip>

# Update clone URL on VM if you changed github_repo_url
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'sudo sed -i "s|^export GITHUB_REPO=.*|export GITHUB_REPO=https://github.com/geeksnap/oracle-sql-firewall-demo.git|" /root/sqlfw-bootstrap.env'

# Re-run install (must use bash -c so log redirection runs as root)
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'sudo bash -c "/usr/local/bin/sqlfw-install-apps.sh >> /var/log/sqlfw-install.log 2>&1"'

ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'sudo tail -f /var/log/sqlfw-install.log'
```

**B — Recreate compute instance:** update compute stack Variables → **Plan → Apply** (Terraform replaces the VM; cloud-init runs fresh).

---

## Step 3 — Compute stack (Resource Manager)

**Prerequisite:** Step 2 Apply job **Succeeded** (DB stack state must exist).

**Create stack** → `sqlfw-compute-stack.zip` (same wizard choices as Step 2; name e.g. `sqlfw-compute`).

**Variables** ( **`db_stack_id` is required** — without it Plan fails looking for local state):

```hcl
region          = "ap-tokyo-1"                  # same as DB stack
compartment_id  = "ocid1.compartment.oc1....."  # same as DB stack
ssh_public_key  = "ssh-ed25519 AAAA... sqlfw"   # same key as DB stack
project_prefix  = "sqlfw-demo"                  # same as DB stack
db_stack_id     = "ocid1.ormstack.oc1....."    # REQUIRED — DB stack OCID from Step 2
github_repo_url = "https://github.com/geeksnap/oracle-sql-firewall-demo.git"   # public repo
# github_repo_url = "https://<TOKEN>@github.com/geeksnap/oracle-sql-firewall-demo.git"  # private only
github_branch   = "main"
```

> **`db_stack_id` is mandatory** in Resource Manager. Copy from **DB stack → Stack information → OCID** (starts with `ocid1.ormstack.`).  
> Do **not** rely on `db_state_path` — the job runner has no `../db/terraform.tfstate`.

**Run:** Plan → Apply (~2–5 min for VM creation).

> **Apply Succeeded ≠ apps ready.** Terraform creates the VM; **cloud-init** then installs Node, clones GitHub, bootstraps the DB, and starts systemd (**10–20 min**).

**Stack → Outputs** — note `compute_public_ip`, `aegis_vault_url`, `luminaforge_url`.

**Wait for bootstrap** (required before Step 4):

```bash
COMPUTE_IP=<from terraform output compute_public_ip>
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'sudo tail -f /var/log/sqlfw-install.log'
```

Success line: `[SUCCESS] Apps + DB schema ready`

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'sudo systemctl is-active aegis-vault luminaforge'
```

Both must print `active`.

**Smoke test** (after bootstrap):

```bash
curl -s -o /dev/null -w "Aegis %{http_code}\n"  http://$COMPUTE_IP:3000
curl -s -o /dev/null -w "Lumina %{http_code}\n" http://$COMPUTE_IP:3001
```

Expect **200** or **307**. Connection refused → bootstrap still running.

---

## Step 4 — Initialize demo (once per fresh DB)

**Prerequisite:** Step 3 bootstrap complete (`[SUCCESS]` + both services `active`).

1. Open **Aegis Vault** (`aegis_vault_url`) → **Demo Control**
2. **Initialize default demo policy** (LuminaForge must be running on `:3001`)
3. Open **LuminaForge** (`luminaforge_url`) — browse tabs to generate traffic
4. Back in Demo Control: **Stop SQL capture** → **Generate Allow List**

Details: [`terraform/README.md`](README.md#phase-4--first-time-demo-policy-required-once-per-fresh-db) and [`luminaforge/SPEC-luminaforge.md`](../luminaforge/SPEC-luminaforge.md) §6.1

---

## Step 5 — Login & verify (after Terraform succeeds)

Use this checklist after **DB stack** Apply succeeds, then again after **compute stack** + bootstrap.

### 5A — DB stack only (Terraform job Succeeded)

**Console checks**

1. **Resource Manager** → DB stack → **Outputs** — copy:
   - `db_connection_string`
   - `pdb_name` (e.g. `SQLFWPDB1`)
   - `sys_password`, `app_db_password` (click **Show** on sensitive outputs)
2. **Oracle Base Database** → DB system `sqlfw-demo` (or your `project_prefix`) → **Lifecycle state = AVAILABLE**
3. **Networking → VCN** `sqlfw-demo-vcn` → subnets `sqlfw-demo-db-subnet`, `sqlfw-demo-compute-subnet` exist
4. **Service gateway** attached to the VCN

**Schema is not loaded yet** — that runs on the compute VM (Step 3 cloud-init). At this stage you have an empty PDB with only Oracle defaults.

---

### 5B — Compute stack + bootstrap

**From your laptop**

```bash
# Compute stack → Outputs
COMPUTE_IP=<compute_public_ip>
AEGIS_URL=<aegis_vault_url>
LUMINA_URL=<luminaforge_url>

# 1. Bootstrap finished
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'grep SUCCESS /var/log/sqlfw-install.log'

# 2. Services running
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'sudo systemctl is-active aegis-vault luminaforge'

# 3. HTTP smoke test
curl -s -o /dev/null -w "Aegis %{http_code}\n"  $AEGIS_URL
curl -s -o /dev/null -w "Lumina %{http_code}\n" $LUMINA_URL
```

Expect: `[SUCCESS] Apps + DB schema ready`, both services `active`, HTTP **200** or **307**.

**Browser login (no password — demo apps)**

| App | URL | What you should see |
|-----|-----|---------------------|
| **Aegis Vault** | `http://<compute_public_ip>:3000` | SOC dashboard, sidebar (Dashboard, Demo Control, …) |
| **LuminaForge** | `http://<compute_public_ip>:3001` | Demo fintech UI, nav tabs |

---

### 5C — Verify database schema (from compute VM)

SSH as `opc`, then run checks as app user or with sqlplus.

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP
```

**Option 1 — read bootstrap env and sqlplus**

```bash
# Passwords and connect string (root-only file)
sudo grep -E '^(export DB_|export APP_)' /root/sqlfw-bootstrap.env

CONNECT_STRING="<paste db_connection_string from DB stack Outputs>"
APP_PW="<paste app_db_password from DB stack Outputs>"
SYS_PW="<paste sys_password from DB stack Outputs>"
PDB="<paste pdb_name, e.g. SQLFWPDB1>"
```

**Verify app user login**

```bash
sqlplus "AEGIS_APP/${APP_PW}@${CONNECT_STRING}"
```

```sql
SELECT USER FROM dual;
SELECT COUNT(*) AS table_count FROM user_tables;
-- expect AEGIS_APP tables (e.g. firewall-related objects)
EXIT;
```

```bash
sqlplus "luminaforge/${APP_PW}@${CONNECT_STRING}"
```

```sql
SELECT USER FROM dual;
SELECT table_name FROM user_tables ORDER BY 1;
-- expect demo tables, e.g. USERS, PORTFOLIO, TRANSACTIONS, LUXURY_ITEMS, …
EXIT;
```

**Verify SYS packages (bootstrap objects)**

```bash
sqlplus "sys/${SYS_PW}@${CONNECT_STRING} as sysdba"
```

```sql
ALTER SESSION SET CONTAINER = SQLFWPDB1;   -- your pdb_name

SELECT object_name, object_type, status
FROM   dba_objects
WHERE  owner = 'SYS'
  AND  object_name IN ('AEGIS_DEMO_CONTROL', 'AEGIS_FW_FLUSH_LOGS')
ORDER  BY 1, 2;
-- expect PACKAGE BODY / PACKAGE, STATUS = VALID

SELECT username, account_status
FROM   dba_users
WHERE  username IN ('AEGIS_APP', 'LUMINAFORGE');
-- both OPEN

SELECT COUNT(*) AS lumina_tables
FROM   dba_tables
WHERE  owner = 'LUMINAFORGE';
-- expect > 0 (demo schema loaded)

EXIT;
```

**Option 2 — re-run bootstrap log (should idempotently succeed)**

Stop apps first if bootstrap will drop users (`ORA-01940`):

```bash
sudo systemctl stop aegis-vault luminaforge
```

```bash
sudo bash -c 'source /root/sqlfw-bootstrap.env && \
  cd /home/odb_sec/apps/oracle-sql-firewall-demo && \
  sudo -u odb_sec env \
    ORACLE_CLIENT_LIBDIR="$ORACLE_CLIENT_LIBDIR" \
    LD_LIBRARY_PATH="$LD_LIBRARY_PATH" \
    DB_CONNECT_STRING="$DB_CONNECT_STRING" \
    DB_SYS_PASSWORD="$DB_SYS_PASSWORD" \
    DB_PDB_NAME="$DB_PDB_NAME" \
    APP_DB_PASSWORD="$APP_DB_PASSWORD" \
    node scripts/oci-bootstrap-database.mjs'
sudo systemctl start aegis-vault luminaforge
```

Expect ending line: `[SUCCESS] Database bootstrap complete for PDB SQLFWPDB1`

---

### 5D — Verify apps ↔ database (end-to-end)

1. Open **LuminaForge** → any tab (e.g. Portfolio) — page loads without ORA errors
2. Open **Aegis Vault** → **Dashboard** — loads (may show zero violations initially)
3. **Demo Control** → **Initialize default demo policy** → success toast (requires LuminaForge on `:3001`)
4. Browse LuminaForge tabs → generate SQL traffic
5. **Aegis Dashboard** → violations appear (or **Threat Feed**)
6. Demo Control → **Stop SQL capture** → **Generate Allow List** → success

If step 3 fails with ORA error → schema/bootstrap issue (repeat 5C).  
If apps show connection errors → check `.env` on compute:

```bash
ssh opc@$COMPUTE_IP 'sudo cat /home/odb_sec/apps/oracle-sql-firewall-demo/aegis-vault/.env'
ssh opc@$COMPUTE_IP 'sudo cat /home/odb_sec/apps/oracle-sql-firewall-demo/luminaforge/.env'
```

`DB_CONNECTION_STRING`, `DB_PASSWORD`, and `DB_CONTAINER` must match DB stack Outputs.

---

### 5E — Verification checklist (printable)

| # | Check | Pass? |
|---|--------|-------|
| 1 | DB stack Apply **Succeeded** | ☐ |
| 2 | Base DB lifecycle **AVAILABLE** | ☐ |
| 3 | Compute stack Apply **Succeeded** | ☐ |
| 4 | `/var/log/sqlfw-install.log` → `[SUCCESS]` | ☐ |
| 5 | `systemctl is-active` → both **active** | ☐ |
| 6 | Aegis + LuminaForge HTTP 200/307 | ☐ |
| 7 | `sqlplus` AEGIS_APP + luminaforge login OK | ☐ |
| 8 | `AEGIS_DEMO_CONTROL` package **VALID** | ☐ |
| 9 | LuminaForge `user_tables` count > 0 | ☐ |
| 10 | Demo Control **Initialize default demo policy** OK | ☐ |
| 11 | Violations visible in Aegis after LuminaForge traffic | ☐ |

---

## Re-deploy after Terraform or code changes

| Change type | What to do |
|-------------|------------|
| **Terraform `.tf` / cloud-init** | `./package-stacks.sh` → re-upload zip → **Plan → Apply** on affected stack |
| **`allow_ssh_cidr` only** | Update DB stack Variables → **Plan → Apply** on **DB stack** (not compute) |
| **App code on GitHub** | Push to `main` → re-run install script on VM (or recreate compute instance) |
| **Private → public repo** | Remove token from `github_repo_url`; update `/root/sqlfw-bootstrap.env`; re-run install script |

**Full refresh (new VM + latest zip):**

1. `./package-stacks.sh` from `terraform/`
2. DB stack: upload new zip only if DB `.tf` changed; Apply if `allow_ssh_cidr` changed
3. Compute stack: upload new `sqlfw-compute-stack.zip` → Plan → Apply (replaces instance, cloud-init runs)

---

Destroy **compute stack** first, then **DB stack** (each stack → **Destroy** job → confirm).

---

## Quick troubleshooting

| Problem | Fix |
|---------|-----|
| `curl` returns **000** / connection refused; SSH works | **Two layers:** (1) DB stack `allow_ssh_cidr` includes your IP — **Apply** DB stack; (2) firewalld on VM — `sudo firewall-cmd --permanent --add-port=3000/tcp --add-port=3001/tcp && sudo firewall-cmd --reload` (cloud-init does this on new VMs) |
| Cannot open `:3000` / `:3001` from browser | Set `allow_ssh_cidr` on **DB stack** → **Plan → Apply**; confirm firewalld ports (above) |
| **NJS-533** / ORA-12660 in app logs | OCI Base DB needs **thick mode**. Re-run bootstrap script (installs Instant Client 19.31) or rebuild after `ORACLE_CLIENT_LIBDIR` is set |
| **NJS-045** (thick binary not found) | Apps need `serverExternalPackages: ["oracledb"]` in `next.config.ts` + `npm run build` on VM |
| Apply OK but apps down | Wait 10–20 min; `sudo tail -f /var/log/sqlfw-install.log` |
| `Permission denied` on `/var/log/sqlfw-install.log` | Use `sudo bash -c '.../sqlfw-install-apps.sh >> /var/log/sqlfw-install.log 2>&1'` — not `sudo cmd >> log` |
| Compute **plan** fails on remote state | Set **`db_stack_id`** to DB stack OCID (`ocid1.ormstack...`); DB stack Apply must **Succeeded** first |
| `db_home_version` invalid / 400 InvalidParameter | Set **`26.0.0.0.0`** for ap-tokyo-1 26ai (not `23.0.0.0` or placeholder) |
| Password error | Delete password vars; defaults: `"DbAdm12_Ab-cdXy"` / `"AppDb34_Cd-efGh"` (no `sys` / `Oracle`) |
| Object Storage / subnet error | Upload latest zip (service gateway + security list egress); re-Apply DB stack |
| Git clone fails on VM | Public repo URL without token, or PAT in `github_repo_url`; update `/root/sqlfw-bootstrap.env` and re-run install |
| `MODULE_NOT_FOUND` for `oci-bootstrap-database.mjs` | Push `scripts/oci-bootstrap-database.mjs` to GitHub `main`; re-run install script |
| DB listener timeout in log | DB not **AVAILABLE** yet; wait, then re-run install script |
| Demo Control ORA errors / invalid package | Bootstrap incomplete — stop apps, re-run bootstrap (5C Option 2); check `AEGIS_DEMO_CONTROL` **VALID** |
| LuminaForge Market search fails | Same as NJS-533 — thick mode + rebuild |
| RM job permission denied | Add `manage orm-stacks` + `manage orm-jobs` (+ resource-family policies) |
| VCN / subnet overlap error | Change `vcn_cidr` / subnet CIDRs; do not use VCN Wizard |
| Updated zip but RM uses old config | Re-run `./package-stacks.sh` (script deletes old zips first), re-upload both stacks |
