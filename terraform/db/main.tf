locals {
  sys_password      = var.sys_password
  app_db_password   = var.app_db_password
  pdb_name_upper    = upper(var.pdb_name)
  pdb_service_label = lower(var.pdb_name)
  osn_service       = data.oci_core_services.osn.services[0]
  # VCN DNS — avoids VNIC lookup race while DB is still provisioning.
  db_host_fqdn      = "${var.db_hostname}.dbsnet.sqlfwvcn.oraclevcn.com"
  pdb_service_fqdn  = "${local.pdb_service_label}.dbsnet.sqlfwvcn.oraclevcn.com"
  db_connect_string = "${local.db_host_fqdn}:1521/${local.pdb_service_fqdn}"
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

data "oci_core_services" "osn" {
  filter {
    name   = "name"
    values = ["All .* Services In Oracle Services Network"]
    regex  = true
  }
}

data "oci_core_services" "object_storage" {
  filter {
    name   = "name"
    values = ["OCI .* Object Storage"]
    regex  = true
  }
}

resource "oci_core_vcn" "demo" {
  compartment_id = var.compartment_id
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.project_prefix}-vcn"
  dns_label      = "sqlfwvcn"
}

resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.demo.id
  display_name   = "${var.project_prefix}-igw"
  enabled        = true
}

resource "oci_core_service_gateway" "sgw" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.demo.id
  display_name   = "${var.project_prefix}-sgw"

  services {
    service_id = local.osn_service.id
  }
}

resource "oci_core_route_table" "public_rt" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.demo.id
  display_name   = "${var.project_prefix}-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

resource "oci_core_route_table" "db_rt" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.demo.id
  display_name   = "${var.project_prefix}-db-rt"

  route_rules {
    description       = "All OCI services via service gateway (Object Storage for Base DB)"
    destination       = local.osn_service.cidr_block
    destination_type  = "SERVICE_CIDR_BLOCK"
    network_entity_id = oci_core_service_gateway.sgw.id
  }
}

resource "oci_core_security_list" "db_sl" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.demo.id
  display_name   = "${var.project_prefix}-db-sl"

  ingress_security_rules {
    protocol    = "6"
    description = "Oracle listener from compute subnet"
    source      = var.compute_subnet_cidr
    tcp_options {
      min = 1521
      max = 1521
    }
  }

  ingress_security_rules {
    protocol    = "6"
    description = "SSH (optional admin)"
    source      = var.allow_ssh_cidr
    tcp_options {
      min = 22
      max = 22
    }
  }

  egress_security_rules {
    protocol         = "all"
    description      = "Object Storage via service gateway (required for Base DB)"
    destination      = data.oci_core_services.object_storage.services[0].cidr_block
    destination_type = "SERVICE_CIDR_BLOCK"
  }

  egress_security_rules {
    protocol         = "all"
    description      = "All OCI services via service gateway"
    destination      = local.osn_service.cidr_block
    destination_type = "SERVICE_CIDR_BLOCK"
  }

  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }
}

resource "oci_core_security_list" "compute_sl" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.demo.id
  display_name   = "${var.project_prefix}-compute-sl"

  ingress_security_rules {
    protocol    = "6"
    description = "SSH"
    source      = var.allow_ssh_cidr
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol    = "6"
    description = "Aegis Vault"
    source      = var.allow_ssh_cidr
    tcp_options {
      min = 3000
      max = 3000
    }
  }

  ingress_security_rules {
    protocol    = "6"
    description = "LuminaForge"
    source      = var.allow_ssh_cidr
    tcp_options {
      min = 3001
      max = 3001
    }
  }

  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }
}

resource "oci_core_subnet" "db" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.demo.id
  cidr_block                 = var.db_subnet_cidr
  display_name               = "${var.project_prefix}-db-subnet"
  dns_label                  = "dbsnet"
  prohibit_public_ip_on_vnic = true
  route_table_id             = oci_core_route_table.db_rt.id
  security_list_ids          = [oci_core_security_list.db_sl.id]
}

resource "oci_core_subnet" "compute" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.demo.id
  cidr_block                 = var.compute_subnet_cidr
  display_name               = "${var.project_prefix}-compute-subnet"
  dns_label                  = "appsnet"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.public_rt.id
  security_list_ids          = [oci_core_security_list.compute_sl.id]
}

resource "oci_database_db_system" "sqlfw" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  subnet_id           = oci_core_subnet.db.id

  cpu_core_count          = var.db_cpu_core_count
  database_edition        = var.db_edition
  data_storage_size_in_gb  = var.db_data_storage_gb
  db_system_options {
    storage_management = "LVM"
  }
  disk_redundancy = "NORMAL"
  hostname        = var.db_hostname
  license_model   = var.license_model
  node_count      = 1
  shape           = var.db_shape
  ssh_public_keys = [var.ssh_public_key]

  db_home {
    db_version = var.db_home_version
    database {
      admin_password = local.sys_password
      db_name        = "ORCL"
      db_workload    = "OLTP"
      pdb_name       = local.pdb_name_upper
      character_set  = "AL32UTF8"
      ncharacter_set = "AL16UTF16"
    }
  }

  freeform_tags = {
    "Project" = "oracle-sql-firewall-demo"
    "Stack"   = "db"
  }

  lifecycle {
    ignore_changes = [db_home[0].database[0].admin_password]
  }

  depends_on = [
    oci_core_service_gateway.sgw,
    oci_core_route_table.db_rt,
    oci_core_security_list.db_sl,
  ]
}
