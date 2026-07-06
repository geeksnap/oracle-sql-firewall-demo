#!/usr/bin/env bash
# =============================================================================
# Port 80 on the compute VM → redirect to OCI Load Balancer (WAF entry).
#
# LuminaForge listens on :3001 only. Presenters often open the compute public
# IP on port 80; without this redirect that fails. Direct bypass stays :3001.
#
# Designed for Ubuntu 24.04 LTS compute VMs on OCI.
# New Terraform compute stacks configure this automatically via cloud-init when
# enable_waf = true. Use this script only as a manual fallback for VMs where
# cloud-init WAF redirect was not configured (e.g. deployed with enable_waf=false
# and later upgraded).
#
# Usage (on compute VM as root):
#   WAF_LB_URL=http://168.110.61.146 sudo -E bash scripts/setup-waf-port80-redirect.sh
# =============================================================================
set -euo pipefail

: "${WAF_LB_URL:?Set WAF_LB_URL to the sqlfw-demo-lb public IP, e.g. http://168.110.61.146}"

WAF_LB_URL="${WAF_LB_URL%/}"

apt-get install -y nginx

cat >/etc/nginx/conf.d/sqlfw-waf-redirect.conf <<EOF
# LuminaForge WAF entry — redirect compute :80 to Load Balancer (demo-waf-firewall)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 302 ${WAF_LB_URL}\$request_uri;
}
EOF

nginx -t
systemctl enable --now nginx

ufw allow 80/tcp
ufw --force enable

echo "[SUCCESS] http://<compute-public-ip>/ now redirects to ${WAF_LB_URL}/"
echo "Direct LuminaForge bypass unchanged: http://<compute-public-ip>:3001/"
