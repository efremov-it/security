# поднять vault + kk
```sh
make vault-up
make init
```

- Перейти и авторизоваться

http://localhost:8200 

# Проверка данных vault
docker exec -it client sh

# внутри контейнера client:
export VAULT_ADDR=http://vault:8200
vault login -method=oidc
vault kv get secret/demo


# Vault + Keycloak + Zero Trust Практика

## ✔️ Vault + Keycloak (OIDC)
- [x] Поднят Keycloak с Realm `demo`
- [x] Настроен Vault с `auth/oidc`
- [x] Проверена авторизация пользователя
- [x] Используется имя сервиса `keycloak` вместо localhost

## 🔐 Zero Trust
- [ ] Включен mTLS в Vault
- [ ] Все запросы логируются (audit log)
- [ ] Все сервисы проходят проверку токенов или сертификатов

## 👥 RBAC
- [ ] В Keycloak созданы роли `dev`, `admin`
- [ ] Vault role использует `groups_claim`
- [ ] Policies назначаются по ролям

## 🔑 JWT / OIDC
- [x] Используется OIDC токен Keycloak
- [ ] Тест с K8s JWT (подставить из ServiceAccount)

## ☸️ Vault + Kubernetes
- [ ] Vault в Helm-чарте
- [ ] auth/kubernetes настроен
- [ ] Подсистема выдачи секретов работает через `vault-agent`


# Поднятие через minikube

task -t practice/weeks/9-10/Taskfile.yaml up
