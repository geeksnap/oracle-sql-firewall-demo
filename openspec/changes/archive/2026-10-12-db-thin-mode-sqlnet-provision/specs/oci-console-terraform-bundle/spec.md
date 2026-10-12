# Spec Delta

## ADDED Requirements

### Requirement: Console happy path does not require a Thin Mode laptop hop
Published quickstart and quick-deployment docs SHALL NOT require OCI Bastion or Option B (`ssh -A` plus curl on the DB) for a successful first-boot. Compute cloud-init SHALL configure sqlnet from the clone after DB Apply and compute Apply.

#### Scenario: Documented deploy order
- **WHEN** a user follows DB Apply → copy `db_stack_id` → compute Apply
- **THEN** cloud-init configures sqlnet and bootstraps without a required Step 2c / §12 laptop command
- **AND** `terraform/OCI-CONSOLE-QUICKSTART.md`, `terraform/OCI-QUICK-DEPLOYMENT.md`, `terraform/README.md`, and `terraform/DOWNLOAD.md` SHALL NOT contain `curl -fsSL https://raw.githubusercontent.com/` targeting the DB host

#### Scenario: Recovery is documented without GitHub-from-DB
- **WHEN** a presenter uses an old zip or a failed first-boot that still needs sqlnet
- **THEN** the docs show a recovery pipe of the cloned (or laptop) script over SSH to `opc` on the DB FQDN
- **AND** they MAY mention `ssh-add` so agent forwarding works for the presenter key
- **AND** they SHALL NOT present Bastion + curl or Option B curl as the happy path

### Requirement: Published zips that include sqlnet provision are a matched pair
A Resource Manager release that includes compute-side sqlnet provision SHALL publish both `sqlfw-db-stack.zip` and `sqlfw-compute-stack.zip` from the same tag. `terraform/DOWNLOAD.md` SHALL NOT claim an older tag (including `orm-stacks-20261012`) already contains this behavior.

#### Scenario: Download page names the new tag only after publish
- **WHEN** implementation is complete and a new RM tag is cut
- **THEN** `DOWNLOAD.md` points at that tag for both zips
- **AND** until that tag exists, docs MUST NOT state that the current published assets auto-configure sqlnet
