#!/bin/sh

set -e

apk add curl

echo "⏳ Waiting for Keycloak to be ready..."
until curl -s http://localhost:8080/realms/demo/.well-known/openid-configuration | grep issuer > /dev/null; do
  sleep 2
done
echo "✅ Keycloak is ready."

vault login root

vault auth enable oidc

vault write auth/oidc/config \
  oidc_discovery_url="http://localhost:8080/realms/demo" \
  oidc_client_id="vault-client" \
  oidc_client_secret="myclientsecret" \
  default_role="demo"

vault policy write demo - <<EOF
path "secret/data/demo" {
  capabilities = ["read"]
}
EOF

vault write auth/oidc/role/demo \
  bound_audiences="vault-client" \
  allowed_redirect_uris="http://localhost:8250/oidc/callback,http://127.0.0.1:8250/oidc/callback,http://vault:8200/ui/vault/auth/oidc/oidc/callback,http://localhost:8200/ui/vault/auth/oidc/oidc/callback" \
  user_claim="preferred_username" \
  policies="demo"
