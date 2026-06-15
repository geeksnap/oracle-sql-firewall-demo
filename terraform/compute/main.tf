# OCI Resource Manager: pull DB stack state by stack OCID (Console Terraform).
locals {
  use_rm_db_state = trimspace(coalesce(var.db_stack_id, "")) != ""
}

data "oci_resourcemanager_stack_tf_state" "db_rm" {
  count      = local.use_rm_db_state ? 1 : 0
  stack_id   = var.db_stack_id
  local_path = "db-remote.tfstate"
}

data "terraform_remote_state" "db_rm" {
  count   = local.use_rm_db_state ? 1 : 0
  backend = "local"
  config = {
    path = data.oci_resourcemanager_stack_tf_state.db_rm[0].local_path
  }
}

# Local CLI: read DB stack state file from laptop filesystem.
data "terraform_remote_state" "db_local" {
  count   = local.use_rm_db_state ? 0 : 1
  backend = "local"
  config = {
    path = var.db_state_path
  }
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

data "oci_core_images" "ol" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  operating_system_version = "9"
  shape                    = var.compute_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

locals {
  db_state = local.use_rm_db_state ? data.terraform_remote_state.db_rm[0] : data.terraform_remote_state.db_local[0]

  db_connect_string = coalesce(
    var.override_db_connection_string,
    local.db_state.outputs.db_connection_string,
  )
  db_pdb_name = local.db_state.outputs.pdb_name
  app_db_password = coalesce(
    var.override_app_db_password,
    local.db_state.outputs.app_db_password,
  )
  sys_password = coalesce(
    var.override_sys_password,
    local.db_state.outputs.sys_password,
  )
  compute_subnet_id = local.db_state.outputs.compute_subnet_id
  vcn_id            = local.db_state.outputs.vcn_id
}

resource "oci_core_instance" "apps" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  display_name        = "${var.project_prefix}-apps"
  shape               = var.compute_shape

  shape_config {
    ocpus         = var.compute_ocpus
    memory_in_gbs = var.compute_memory_gb
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ol.images[0].id
  }

  create_vnic_details {
    assign_public_ip = true
    subnet_id        = local.compute_subnet_id
    display_name     = "${var.project_prefix}-apps-vnic"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(templatefile("${path.module}/cloud-init.yaml.tftpl", {
      app_user                 = var.app_user
      github_repo_url          = var.github_repo_url
      github_branch            = var.github_branch
      db_connect_string        = local.db_connect_string
      db_pdb_name              = local.db_pdb_name
      app_db_password_b64      = base64encode(local.app_db_password)
      sys_password_b64         = base64encode(local.sys_password)
      project_prefix           = var.project_prefix
    }))
  }

  freeform_tags = {
    "Project" = "oracle-sql-firewall-demo"
    "Stack"   = "compute"
  }
}

data "oci_core_vnic_attachments" "app_vnics" {
  compartment_id      = var.compartment_id
  instance_id         = oci_core_instance.apps.id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
}

data "oci_core_vnic" "app_vnic" {
  vnic_id = data.oci_core_vnic_attachments.app_vnics.vnic_attachments[0].vnic_id
}

locals {
  compute_public_ip = data.oci_core_vnic.app_vnic.public_ip_address
}
