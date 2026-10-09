# oci-console-terraform-bundle Specification

## Purpose
Defines how third parties obtain and deploy the SQL Firewall demo Terraform stacks through OCI Console Resource Manager using GitHub-published, Resource Manager–ready packages without requiring a local Terraform CLI for the happy path.

## Requirements

### Requirement: GitHub publishes Resource Manager stack packages
The project SHALL publish downloadable OCI Resource Manager configuration packages for the existing database and compute Terraform stacks so users can obtain them from GitHub without inventing a parallel stack layout.

#### Scenario: User obtains both stack packages from GitHub
- **WHEN** a user follows the documented GitHub download path for the Console Terraform bundle
- **THEN** they can obtain separate packages for the database stack and the compute stack suitable for upload to Resource Manager Create Stack

#### Scenario: Packages are derived from existing terraform directories
- **WHEN** stack packages are built for publication
- **THEN** their Terraform sources MUST come from `terraform/db` and `terraform/compute` (or an equivalent packaging of those same stacks), not from a third parallel infrastructure definition

### Requirement: Packages are valid Resource Manager zip uploads
Each published stack package MUST be a zip whose root contains that stack’s Terraform configuration files ready for OCI Console **My configuration → .Zip file** upload.

#### Scenario: Zip root layout
- **WHEN** a user uploads `sqlfw-db-stack.zip` or `sqlfw-compute-stack.zip` to Resource Manager
- **THEN** Resource Manager MUST discover `.tf` files at the zip root (or an ORM-supported layout) without requiring nested path navigation by the user

#### Scenario: Local state and secrets excluded
- **WHEN** a stack package is built for publication
- **THEN** the package MUST NOT include `terraform.tfstate*`, `.terraform/`, real `*.tfvars` files, credentials, or private keys

### Requirement: Resource Manager variable schema per stack
Each stack directory SHALL include a Resource Manager `schema.yaml` that declares the Console-facing variables required to create and apply that stack.

#### Scenario: DB stack Create Stack wizard
- **WHEN** a user creates a Resource Manager stack from the published database package
- **THEN** the Console MUST present schema-driven inputs for at least region, compartment, SSH public key, DB home version, and ingress CIDR (or equivalent documented required variables)

#### Scenario: Compute stack Create Stack wizard
- **WHEN** a user creates a Resource Manager stack from the published compute package
- **THEN** the Console MUST present schema-driven inputs for at least region, compartment, SSH public key, and `db_stack_id` (DB Resource Manager stack OCID)

### Requirement: Two-stack Console deploy order is documented and supported
The Console deploy path MUST keep the existing correlation model: apply the database stack first, then apply the compute stack with `db_stack_id` set to the database stack OCID.

#### Scenario: Compute stack without db_stack_id fails clearly
- **WHEN** a user attempts to plan or apply the compute stack in Resource Manager without a valid `db_stack_id`
- **THEN** Terraform validation or documentation MUST prevent a silent misconfigure (empty remote state) and direct the user to set the DB stack OCID

#### Scenario: Documented happy path
- **WHEN** a user follows the GitHub download → OCI Console quickstart path
- **THEN** the docs MUST describe package download, DB stack Apply, copying the DB stack OCID, compute stack Apply with `db_stack_id`, and where to find app URLs / outputs — without requiring local `terraform apply`

### Requirement: Published materials use secret placeholders
User-facing download materials and committed example variable values shipped for public reuse MUST use placeholders for passwords, tokens, and tenant-specific OCIDs; they MUST NOT instruct users to reuse another tenant’s real compartment OCID or production credentials.

#### Scenario: Example configs in published content
- **WHEN** a new user opens example variable guidance from the published Console bundle docs
- **THEN** passwords and compartment identifiers appear as placeholders (for example `CHANGE_ME` / `ocid1.compartment.oc1..example`) rather than live demo secrets

#### Scenario: Sensitive overrides remain Console variables
- **WHEN** a user must supply DB admin or app DB passwords in Resource Manager
- **THEN** those values MUST be entered as stack Variables (marked sensitive where supported), not baked into the downloaded zip
