# Download OCI Console Terraform (Resource Manager) stacks

Deploy the SQL Firewall demo from **OCI Console → Developer Services → Resource Manager** without a local Terraform CLI.

## Release assets (preferred)

Published stack zips for tag **[`orm-stacks-20261010`](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/tag/orm-stacks-20261010)**:

| Asset | Upload order | Direct download |
|-------|--------------|-----------------|
| `sqlfw-db-stack.zip` | **1st** | https://github.com/geeksnap/oracle-sql-firewall-demo/releases/download/orm-stacks-20261010/sqlfw-db-stack.zip |
| `sqlfw-compute-stack.zip` | **2nd** | https://github.com/geeksnap/oracle-sql-firewall-demo/releases/download/orm-stacks-20261010/sqlfw-compute-stack.zip |

| Asset | Contents |
|-------|----------|
| DB zip | `terraform/db` — VCN + Base DB 26ai + `schema.yaml` at zip root |
| Compute zip | `terraform/compute` — apps VM (+ WAF/LB) + `schema.yaml` at zip root |

1. Download both zips from the release above (or open [Releases](https://github.com/geeksnap/oracle-sql-firewall-demo/releases) / [Latest](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/latest) when it lists the same assets).
2. Follow **[OCI-CONSOLE-QUICKSTART.md](OCI-CONSOLE-QUICKSTART.md)** starting at **Step 2** (DB stack).

New tenancy or another compartment (login, SSH key, numbered Console steps): **[OCI-QUICK-DEPLOYMENT.md](OCI-QUICK-DEPLOYMENT.md)**.

If no release assets exist yet, use the alternate build below, or run **Actions → Package OCI Resource Manager stacks → Run workflow**, then download the `sqlfw-orm-stacks` artifact.

## Alternate — build from a clone

```bash
git clone https://github.com/geeksnap/oracle-sql-firewall-demo.git
cd oracle-sql-firewall-demo/terraform
chmod +x package-stacks.sh
./package-stacks.sh
```

Produces gitignored zips in this directory (`sqlfw-*-stack.zip`).

## Deploy order (do not reverse)

1. **DB stack** — Create Stack → upload `sqlfw-db-stack.zip` → Plan → Apply (~60–90 min).
2. Copy **DB stack OCID** (`ocid1.ormstack...`).
3. **Compute stack** — upload `sqlfw-compute-stack.zip` → set **`db_stack_id`** → Plan → Apply.

Full steps, IAM, passwords, and troubleshooting: [OCI-CONSOLE-QUICKSTART.md](OCI-CONSOLE-QUICKSTART.md) · [README.md](README.md)

## Secrets

Never put real passwords, PATs, or private keys into the zip. Enter them only as Resource Manager **Variables** (schema marks passwords as sensitive). Example files use placeholders only.
