DEFAULT_GOAL: up

up:
	docker compose -f tools/docker-compose.yml up -d
	docker compose up -d

down:
	docker compose -f tools/docker-compose.yml down
	docker compose down

vault-up:
	docker compose -f practice/weeks/9-10/vaultKK/docker-compose.yml up -d

vault-down:
	docker compose -f practice/weeks/9-10/vaultKK/docker-compose.yml down

init:
	@echo "🚀 Configuring Vault OIDC..."
	docker exec vault sh /docker-entrypoint-initdev.d/init.sh

vault-login:
	@echo "🔑 Open http://localhost:8080 and login to Keycloak as user 'dev' (password 'dev')"
	@echo "Then get token and login to Vault using:"
	@echo "VAULT_ADDR=http://localhost:8200 vault login -method=oidc"

test:
	@echo "✅ Testing access to Vault"
	docker exec -e VAULT_ADDR=http://vault:8200 client sh -c "\
	  vault login -method=oidc"
