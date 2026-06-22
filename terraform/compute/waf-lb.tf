# =============================================================================
# OCI Load Balancer + Web Application Firewall (WAF) for LuminaForge demo path
# Matches manual stack: sqlfw-demo-lb, sqlfw-demo-waf-policy, demo-waf-firewall
# =============================================================================

locals {
  waf_access_control_json = var.enable_waf ? jsondecode(file("${path.module}/waf/waf-request-access-control-sqli.json")) : null
  waf_protection_json     = var.enable_waf ? jsondecode(file("${path.module}/waf/waf-request-protection-sqli.json")) : null
  waf_lb_url              = var.enable_waf ? "http://${oci_core_public_ip.lb[0].ip_address}" : ""
}

resource "oci_core_private_ip" "app" {
  count        = var.enable_waf ? 1 : 0
  compartment_id = var.compartment_id
  subnet_id      = local.compute_subnet_id
  display_name   = "${var.project_prefix}-apps-private-ip"
  lifetime       = "RESERVED"
}

resource "oci_core_public_ip" "lb" {
  count          = var.enable_waf ? 1 : 0
  compartment_id = var.compartment_id
  display_name   = "${var.project_prefix}-lb-public-ip"
  lifetime       = "RESERVED"
}

resource "oci_load_balancer_load_balancer" "demo" {
  count          = var.enable_waf ? 1 : 0
  compartment_id = var.compartment_id
  display_name   = "${var.project_prefix}-lb"
  shape          = "flexible"
  subnet_ids     = [local.compute_subnet_id]
  is_private     = false

  shape_details {
    minimum_bandwidth_in_mbps = var.load_balancer_bandwidth_mbps
    maximum_bandwidth_in_mbps = var.load_balancer_bandwidth_mbps
  }

  reserved_ips {
    id = oci_core_public_ip.lb[0].id
  }

  freeform_tags = {
    "Project" = "oracle-sql-firewall-demo"
    "Stack"   = "compute"
  }

  depends_on = [oci_core_private_ip.app]
}

resource "oci_load_balancer_backend_set" "luminaforge" {
  count            = var.enable_waf ? 1 : 0
  load_balancer_id = oci_load_balancer_load_balancer.demo[0].id
  name             = "luminaforge-backend"
  policy           = "ROUND_ROBIN"

  health_checker {
    protocol            = "HTTP"
    port                = 3001
    url_path            = "/"
    interval_ms         = 10000
    timeout_in_millis   = 3000
    retries             = 3
    return_code         = 200
    response_body_regex = ".*"
  }
}

resource "oci_load_balancer_backend" "luminaforge" {
  count            = var.enable_waf ? 1 : 0
  load_balancer_id = oci_load_balancer_load_balancer.demo[0].id
  backendset_name  = oci_load_balancer_backend_set.luminaforge[0].name
  ip_address       = oci_core_private_ip.app[0].ip_address
  port             = 3001
  weight           = 1
  backup           = false
  drain            = false
  offline          = false
}

resource "oci_load_balancer_listener" "http" {
  count                    = var.enable_waf ? 1 : 0
  load_balancer_id         = oci_load_balancer_load_balancer.demo[0].id
  name                     = "http-listener"
  default_backend_set_name = oci_load_balancer_backend_set.luminaforge[0].name
  port                     = 80
  protocol                 = "HTTP"

  connection_configuration {
    idle_timeout_in_seconds = "60"
  }
}

resource "oci_waf_web_app_firewall_policy" "demo" {
  count          = var.enable_waf ? 1 : 0
  compartment_id = var.compartment_id
  display_name   = "${var.project_prefix}-waf-policy"

  actions {
    name = "Block SQLi 403"
    type = "RETURN_HTTP_RESPONSE"
    code = 403
    body {
      type = "STATIC_TEXT"
      text = "{\"code\":\"WAF_BLOCKED\",\"message\":\"SQL injection detected by OCI WAF\"}"
    }
    headers {
      name  = "Content-Type"
      value = "application/json"
    }
  }

  actions {
    name = "Pre-configured Allow Action"
    type = "ALLOW"
  }

  actions {
    name = "Pre-configured Check Action"
    type = "CHECK"
  }

  request_access_control {
    default_action_name = local.waf_access_control_json.defaultActionName

    dynamic "rules" {
      for_each = local.waf_access_control_json.rules
      content {
        action_name        = rules.value.actionName
        name               = rules.value.name
        type               = rules.value.type
        condition          = rules.value.condition
        condition_language = rules.value.conditionLanguage
      }
    }
  }

  request_protection {
    body_inspection_size_limit_exceeded_action_name = local.waf_protection_json.bodyInspectionSizeLimitExceededActionName
    body_inspection_size_limit_in_bytes             = local.waf_protection_json.bodyInspectionSizeLimitInBytes

    dynamic "rules" {
      for_each = local.waf_protection_json.rules
      content {
        action_name                = rules.value.actionName
        name                       = rules.value.name
        type                       = rules.value.type
        is_body_inspection_enabled = rules.value.isBodyInspectionEnabled

        dynamic "protection_capabilities" {
          for_each = rules.value.protectionCapabilities
          content {
            key                            = protection_capabilities.value.key
            version                        = protection_capabilities.value.version
            action_name                    = protection_capabilities.value.actionName
            collaborative_action_threshold = protection_capabilities.value.collaborativeActionThreshold
          }
        }
      }
    }
  }

  freeform_tags = {
    "Project" = "oracle-sql-firewall-demo"
    "Stack"   = "compute"
  }
}

resource "oci_waf_web_app_firewall" "demo" {
  count                      = var.enable_waf ? 1 : 0
  compartment_id             = var.compartment_id
  display_name               = "demo-waf-firewall"
  backend_type               = "LOAD_BALANCER"
  load_balancer_id           = oci_load_balancer_load_balancer.demo[0].id
  web_app_firewall_policy_id = oci_waf_web_app_firewall_policy.demo[0].id

  freeform_tags = {
    "Project" = "oracle-sql-firewall-demo"
    "Stack"   = "compute"
  }

  depends_on = [
    oci_load_balancer_listener.http,
    oci_load_balancer_backend.luminaforge,
  ]
}
