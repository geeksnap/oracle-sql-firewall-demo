# OCI Quick Deployment Steps

Deploy the SQL Firewall demo into **a new OCI compartment** from the OCI Console. No local Terraform. This is a **new** stack (new VCN, new Base DB, new Ubuntu VM) — not an update of the existing public demo at `161.33.154.45`.

| | |
|--|--|
| **Time** | ~15 min prep + **60–90 min** DB Apply + **5–15 min** compute Apply + **10–20 min** cloud-init |
| **Compute OS** | Ubuntu 24.04 (created for you) |
| **SSH user** | **`ubuntu`** on the apps VM |
| **Database apps** | **node-oracledb Thin Mode** — do **not** install Oracle Instant Client |
| **Zips** | GitHub release [`orm-stacks-20261010`](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/tag/orm-stacks-20261010) |

```text
Your browser
    → Aegis Vault :3000  and  LuminaForge :3001  on the compute VM
    → optional WAF path :80  (load balancer)
    → private VCN  →  Base Database 26ai (PDB)

The DB stack creates the VCN. Do not use the VCN Wizard.
Apply the DB zip first, then the compute zip (paste db_stack_id).
```

---

## Safe vs destructive

| Action | Kind | Notes |
|--------|------|--------|
| Sign in, pick region, create/pick a **new** compartment | Safe | Does not change the live demo |
| Generate an SSH key on your laptop | Safe | Keep the **private** key only on your machine |
| Download the two zips | Safe | No secrets inside |
| Resource Manager **Plan** | Safe | Preview only — creates nothing |
| **Apply** a **new** stack in an **empty / dedicated** compartment | Creates resources | Expected. Costs start when Apply succeeds |
| SSH, read logs, open app URLs, Initialize demo policy | Safe for *your* new stack | Demo Control writes only to *your* new PDB |
| **Apply** on a stack that already has resources | Can be **destructive** | May replace the VM or change networking. Never do this on the live demo stacks |
| Resource Manager **Destroy** | **Destructive** | Deletes the VM, DB, VCN, load balancer, WAF |
| Destroy **DB** while compute still exists | **Destructive / broken** | Always destroy **compute first**, then DB |

**Do not** upload these zips onto, or Apply against, the live demo compartment or the stacks behind `161.33.154.45`.

---

## 1. Sign in to your OCI tenancy

1. Open [https://cloud.oracle.com](https://cloud.oracle.com).
2. Enter your **cloud account / tenancy** name, then your user (or SSO).
3. Confirm you are in the tenancy you intend to bill. Profile (top-right) shows the tenancy name.

You do **not** need the OCI CLI or a local Terraform install for this guide.

---

## 2. Choose the region

1. Use the **region** menu (top-right of the Console).
2. Pick a region that offers **Oracle Base Database 26ai** (you will confirm in step 7).
3. Stay in this region for every later step. You will type the **same** region string into **both** Resource Manager stacks (for example `us-ashburn-1` or `ap-singapore-1`).

---

## 3. Create or pick a compartment

Use a **dedicated** compartment so this demo is isolated from the live stack and from other workloads.

**Create a new compartment**

1. **Identity & Security → Compartments → Create Compartment**.
2. **Name:** something like `sqlfw-demo` (must be unique under the parent).
3. **Parent compartment:** usually the tenancy (root) or your team folder.
4. Create it, open it, click **Copy OCID**. It looks like `ocid1.compartment.oc1..aaaaaaaa…`.

**Or pick an existing compartment**

1. **Identity & Security → Compartments**.
2. Open the compartment you want.
3. **Copy OCID**.

If that compartment already has a VCN using `10.40.0.0/16`, either pick a different compartment or you will need to change the CIDR variables in step 9.

**Do not** create a VCN yourself. The DB stack creates `sqlfw-demo-vcn` and the subnets.

---

## 4. Add IAM policies if required

Skip this step if you are a **tenancy administrator** (you can already create VCNs, Base DB, compute, load balancers, and Resource Manager stacks).

If Apply later fails with **404 / 403 / NotAuthorized**, an admin must add a policy in the **parent** of your demo compartment (often the tenancy root):

**Identity & Security → Policies → Create Policy**, then statements like these (replace the group and compartment **names**):

```text
Allow group YOUR_GROUP to manage database-family in compartment YOUR_COMPARTMENT
Allow group YOUR_GROUP to manage instance-family in compartment YOUR_COMPARTMENT
Allow group YOUR_GROUP to manage virtual-network-family in compartment YOUR_COMPARTMENT
Allow group YOUR_GROUP to manage load-balancers in compartment YOUR_COMPARTMENT
Allow group YOUR_GROUP to manage waf-family in compartment YOUR_COMPARTMENT
Allow group YOUR_GROUP to manage orm-stacks in compartment YOUR_COMPARTMENT
Allow group YOUR_GROUP to manage orm-jobs in compartment YOUR_COMPARTMENT
```

Some tenancies use `manage stacks` and `manage jobs` instead of `orm-stacks` / `orm-jobs`.

Optional (only if you use a Bastion in step 12): permission to manage bastions in that compartment.

---

## 5. Create an SSH key on your laptop

You need **one** key pair for this demo. The **public** key goes into OCI. The **private** key stays on your laptop and is how you SSH.

| File | What it is | Where it goes |
|------|------------|----------------|
| `~/.ssh/id_ed25519_sqlfw.pub` | **Public** key (one line, starts with `ssh-ed25519`) | Paste into Resource Manager **Variables → SSH public key** on **both** stacks |
| `~/.ssh/id_ed25519_sqlfw` | **Private** key (no `.pub`) | Laptop only. Use with `ssh -i`. **Never** paste into the Console, **never** put in git, **never** put in the zip |

On macOS or Linux (Git Bash or PowerShell on Windows also works):

```bash
ssh-keygen -t ed25519 -C "sqlfw-oci-demo" -f ~/.ssh/id_ed25519_sqlfw
```

Press Enter for an empty passphrase (fine for a personal demo key), or set one if you prefer.

Show the **public** key — this is the line you will paste:

```bash
cat ~/.ssh/id_ed25519_sqlfw.pub
```

Copy the **entire** single line, including `ssh-ed25519` and the comment at the end.

If `ssh-keygen` asks to overwrite an existing file, answer **no** unless you intend to replace that key.

---

## 6. Note your public IP

The DB stack security list uses this for SSH (port 22) and the app ports (3000 / 3001).

1. From the same network you will browse and SSH from, find your public IPv4 (for example visit a “what is my IP” page, or run `curl -s https://ifconfig.me`).
2. Write it as `YOUR.PUBLIC.IP/32` (example shape: `203.0.113.10/32`).

For a short-lived open demo you may use `0.0.0.0/0` (anyone on the internet can reach the ports). Prefer `/32` when you can.

---

## 7. Confirm Database 26ai in this region

1. **Oracle Database → Oracle Base Database → Create DB system** (or **Create database**).
2. Look at **Database version** / DB home version. You need a **`26.x.x.x.x`** value (for example `26.0.0.0.0`).
3. Copy the latest `26.x` string offered.
4. **Cancel** the create wizard — you are only reading the version. The DB stack will create the system.

If there is no `26.x` option, pick another region (step 2) and start again. Do not invent a version string.

---

## 8. Download both stack zips

Open release **[`orm-stacks-20261010`](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/tag/orm-stacks-20261010)** and download **both** files:

| Order | File | Direct URL |
|------:|------|------------|
| **1st** | `sqlfw-db-stack.zip` | https://github.com/geeksnap/oracle-sql-firewall-demo/releases/download/orm-stacks-20261010/sqlfw-db-stack.zip |
| **2nd** | `sqlfw-compute-stack.zip` | https://github.com/geeksnap/oracle-sql-firewall-demo/releases/download/orm-stacks-20261010/sqlfw-compute-stack.zip |

Do **not** reverse the order later. Each zip has Terraform files and `schema.yaml` at the **root**. They contain **no** passwords, **no** private keys, **no** real `terraform.tfvars`.

---

## 9. Create the database stack

1. In the Console, stay in the region from step 2.
2. **Developer Services → Resource Manager → Stacks → Create stack**.
3. **Configuration source:** **My configuration** → **.Zip file** → upload **`sqlfw-db-stack.zip`**.
4. **Create in compartment:** the compartment from step 3 (where the *stack object* lives — use the same demo compartment).
5. **Terraform version:** **1.5** or newer.
6. **Name:** for example `sqlfw-db`.
7. Continue to **Configure variables**. Fill **Required**:

| Variable | What to enter |
|----------|----------------|
| **Region** | Same as the Console region selector |
| **Compartment** | The compartment from step 3 (picker, or paste the OCID) |
| **SSH public key** | The **full** `.pub` line from step 5 — not the private key |
| **DB home version (26ai)** | The exact `26.x.x.x.x` string from step 7 |
| **Allowed ingress CIDR** | `YOUR.PUBLIC.IP/32` from step 6 (or `0.0.0.0/0` for an open demo) |

**Passwords:** leave the password fields **blank**. The stack uses its demo defaults. Do not type secrets into git, into the zip, or into a ticket. If your tenancy requires you to set them, enter them **only** in this Variables screen (they are marked sensitive). Do not use a value that contains `Oracle` or `sys`.

**Optional:** leave `project_prefix` as `sqlfw-demo` and `pdb_name` as `SQLFWPDB1` unless you already have those names in *this* compartment. Change VCN/subnet CIDRs **only** if `10.40.0.0/16` overlaps.

8. Create the stack. **Do not Apply yet** if you want to review Plan first (next step).

---

## 10. Plan and Apply the database stack

1. Open the DB stack → **Plan** → run the job → wait until **Succeeded**.
2. The plan should show a **new VCN**, two subnets, security lists, and a Base DB system. If it shows destroy of existing resources, **stop** — you are on the wrong stack or compartment.
3. **Apply** → confirm → run the job.

Wait until the Apply job is **Succeeded** (**60–90 minutes** is normal). Optionally confirm **Oracle Base Database** → your DB system → lifecycle **AVAILABLE**.

Saving a variable later does nothing until you **Plan → Apply** again.

---

## 11. Copy the DB stack OCID and outputs

On the DB stack:

1. **Stack information → OCID** — copy the whole value. It starts with `ocid1.ormstack.`. You need this as **`db_stack_id`** for compute. Without it, compute Plan fails.
2. **Outputs** — you may copy `db_connection_string`, `pdb_name`, `vcn_id` (handy for Bastion). Sensitive outputs have a **Show** control in the Console; do not paste them into git.

---

## 12. Configure the database for Thin Mode (required)

The apps use **Thin Mode** (pure JavaScript `oracledb`). They do **not** use Instant Client. OCI Base Database may otherwise negotiate Native Network Encryption and cloud-init will fail (**NJS-533 / ORA-12660**).

Run this **once** on the **DB host**. That VM has **no public IP**. SSH user on the DB host is **`opc`** (not `ubuntu`).

**Option A — Bastion, before compute (preferred)**

1. **Identity & Security → Bastions → Create bastion** in the demo compartment, on the VCN the DB stack just created.
2. Create a **managed SSH** session to the DB private IP (or FQDN), port **22**.
3. Connect as **`opc`** using the **private** key from step 5, then:

```bash
curl -fsSL https://raw.githubusercontent.com/geeksnap/oracle-sql-firewall-demo/main/scripts/configure-db-sqlnet-for-thin-mode.sh | sudo bash
```

Expect: `[SUCCESS] sqlnet.ora updated — thin-mode clients can connect on TCP :1521`

**Option B — after compute exists**

Skip to steps 13–14, then from your laptop (same private key):

```bash
export COMPUTE_IP="<compute_public_ip from step 14>"

ssh -A -i ~/.ssh/id_ed25519_sqlfw ubuntu@"$COMPUTE_IP" \
  'ssh -o StrictHostKeyChecking=no opc@sqlfwdb.dbsnet.sqlfwvcn.oraclevcn.com \
    "curl -fsSL https://raw.githubusercontent.com/geeksnap/oracle-sql-firewall-demo/main/scripts/configure-db-sqlnet-for-thin-mode.sh | sudo bash"'
```

If you changed `project_prefix`, use the DB FQDN from DB stack output `db_host_fqdn` instead. If cloud-init already failed with NJS-533 / ORA-12660, run Option B, then re-run the install script in step 16.

---

## 13. Create the compute stack

**Prerequisite:** DB Apply **Succeeded**. You have the DB stack OCID.

1. **Developer Services → Resource Manager → Stacks → Create stack**.
2. **My configuration → .Zip file** → upload **`sqlfw-compute-stack.zip`**.
3. Same compartment, Terraform **1.5+**, name for example `sqlfw-compute`.
4. **Configure variables:**

| Variable | What to enter |
|----------|----------------|
| **Region** | **Same string** as the DB stack |
| **Compartment** | **Same** as the DB stack |
| **SSH public key** | **Same** `.pub` line as the DB stack |
| **DB Resource Manager stack OCID** (`db_stack_id`) | The `ocid1.ormstack.…` value from step 11 |
| **GitHub repo URL** | Leave the default: `https://github.com/geeksnap/oracle-sql-firewall-demo.git` |
| **GitHub branch** | Leave the default: `main` |
| **Enable WAF + Load Balancer** | Leave **true** unless you want LuminaForge on `:3001` only |
| **Project prefix** | Must match the DB stack (`sqlfw-demo` unless you changed it) |

Leave override password / connection fields **blank**. Compute reads those from the DB stack.

Do **not** set `db_state_path` — Resource Manager has no local `terraform.tfstate`. **`db_stack_id` is required.**

---

## 14. Plan and Apply the compute stack

1. **Plan** → Succeeded. Confirm it will create a compute instance (and, with WAF on, a load balancer + WAF). It must **not** try to create another VCN.
2. **Apply** → wait **5–15 minutes** until **Succeeded**.

**Apply Succeeded does not mean the apps are ready.** Terraform only built the VM (and LB/WAF). Cloud-init still has to install Node.js, clone GitHub, wait for the DB listener, bootstrap the PDB, and start systemd.

From **Outputs**, copy:

| Output | Use |
|--------|-----|
| `compute_public_ip` | SSH |
| `aegis_vault_url` | Aegis Vault **:3000** |
| `luminaforge_url` | LuminaForge **:3001** |
| `luminaforge_waf_url` | LuminaForge via WAF **:80** (when WAF is enabled) |

These IPs are **yours**. They will not be `161.33.154.45`.

---

## 15. Wait for cloud-init

Wait **10–20 minutes**. Every few minutes open `aegis_vault_url` and `luminaforge_url` in a browser. Connection refused usually means install is still running.

Optional — watch the log (step 16). Done when the log contains:

```text
[SUCCESS] Apps + DB schema ready
```

---

## 16. SSH as `ubuntu`

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@<compute_public_ip>
```

Use **`ubuntu`**, not `opc` and not `root`. (`opc` is only for the DB host.)

On the VM:

```bash
sudo tail -f /var/log/sqlfw-install.log
# Ctrl-C when you see [SUCCESS]

sudo systemctl is-active aegis-vault luminaforge
# both must print: active
```

If you used Thin Mode Option B after a failed bootstrap:

```bash
sudo bash -c "/usr/local/bin/sqlfw-install-apps.sh >> /var/log/sqlfw-install.log 2>&1"
sudo tail -f /var/log/sqlfw-install.log
```

---

## 17. Verify the apps

The demo UIs have **no login password**.

| App | From compute Outputs | What you should see |
|-----|----------------------|---------------------|
| **Aegis Vault** | `aegis_vault_url` → `http://<your_compute_ip>:3000` | SOC dashboard / sidebar (Dashboard, Demo Control, …) |
| **LuminaForge** | `luminaforge_url` → `http://<your_compute_ip>:3001` | Demo fintech UI |
| **LuminaForge via WAF** (optional) | `luminaforge_waf_url` → `http://<your_lb_ip>/` | Same UI through the load balancer on port **80** |

HTTP **200** or a short redirect is success. If the browser hangs:

- Confirm `allow_ssh_cidr` on the **DB** stack includes your IP, then **Plan → Apply** that DB stack (not compute).
- On the VM: `sudo ufw status` should show **3000/tcp** and **3001/tcp** ALLOW (and **80/tcp** when WAF is on).

---

## 18. Initialize the demo policy (once per new DB)

Do this only after both apps load.

1. Open **Aegis Vault** → **Demo Control**.
2. **Initialize default demo policy** (LuminaForge must already be up on `:3001`).
3. Open **LuminaForge** and click around (this generates SQL).
4. Back in Demo Control: **Stop SQL capture** → **Generate Allow List**.

---

## If something goes wrong

| Symptom | What to do |
|---------|------------|
| Compute **Plan** fails on remote state / empty `db_stack_id` | Paste the DB stack OCID (`ocid1.ormstack.…`). DB Apply must already be **Succeeded** |
| `db_home_version` invalid | Repeat step 7; use the exact `26.x` string from **this** region |
| Apply **403 / NotAuthorized** | Step 4 policies |
| VCN CIDR overlap | Change `vcn_cidr` / subnet CIDRs on a **new** DB stack, or use another compartment. Do not use VCN Wizard |
| Apps down after Apply Succeeded | Wait 10–20 min; `sudo tail -f /var/log/sqlfw-install.log` |
| Log shows **NJS-533 / ORA-12660** | Step 12, then re-run `sqlfw-install-apps.sh` (step 16) |
| Browser cannot open `:3000` / `:3001` but SSH works | DB stack `allow_ssh_cidr` + Apply; check `sudo ufw status` |
| SSH `Permission denied` | `-i ~/.ssh/id_ed25519_sqlfw` and user **`ubuntu`**. Confirm you pasted the matching **public** key |

More detail: [`OCI-CONSOLE-QUICKSTART.md`](OCI-CONSOLE-QUICKSTART.md).

---

## Tear down (**destructive**)

When you are finished with **this** compartment’s demo:

1. Resource Manager → **compute** stack → **Destroy** → confirm → wait until Succeeded.
2. Resource Manager → **DB** stack → **Destroy** → confirm → wait until Succeeded.

Reverse order (DB first) leaves compute unable to tear down cleanly. Destroy deletes the VM, database, VCN, and WAF/LB for **this** stack only — still do not run Destroy on the live public demo stacks.

---

## Related

- Zip downloads: [`DOWNLOAD.md`](DOWNLOAD.md)
- Full Console reference: [`OCI-CONSOLE-QUICKSTART.md`](OCI-CONSOLE-QUICKSTART.md)
- Local CLI Terraform: [`README.md`](README.md)
