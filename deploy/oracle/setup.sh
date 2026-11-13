#!/usr/bin/env bash
# One-time preparation of a fresh Ubuntu 24.04 server on Oracle Cloud.
# Run it on the server:  bash deploy/oracle/setup.sh
set -euo pipefail

echo "==> Installing Docker"
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 iptables-persistent
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

echo "==> Opening ports 80 and 443 in the server's own firewall"
# Oracle's Ubuntu images reject everything except SSH until these rules exist.
for port in 80 443; do
  sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null \
    || sudo iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
done
sudo iptables -C INPUT -p udp --dport 443 -j ACCEPT 2>/dev/null \
  || sudo iptables -I INPUT 1 -p udp --dport 443 -j ACCEPT
sudo netfilter-persistent save

echo
echo "Done. Log out and back in (so your user can run docker), then:"
echo "  cd deploy/oracle && cp .env.example .env && nano .env"
echo "  docker compose up -d --build"
