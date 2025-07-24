## 📌 Что такое **Policy Enforcement**?

**Policy enforcement** — это «принудительное применение политик» в рамках DevSecOps. Политики могут включать:

* Требование подписывать образы (например, только подписанные Cosign-ом).
* Требование прохождения SAST/DAST/Secret scan.
* Запрет на использование образов из непроверенных регистри.
* Запрет деплоя в production без прохождения утверждения (approval).
* Проверка наличия attestation и соответствия SLSA уровню.
* Запрет использования устаревших или уязвимых зависимостей.

---

## 🧩 Где применяется Policy Enforcement?

| Этап                            | Что можно проверять                            | Инструменты                                    |
| ------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| ✅ GitHub/GitLab Pull Request    | Signed commits, secret scan                    | Gitleaks, pre-commit hooks, OPA/GitHub Actions |
| ✅ Build stage                   | Проверка SBOM, SLSA provenance, подписи образа | Cosign, SLSA verifier                          |
| ✅ Push в registry               | Проверка подписи и аттестации                  | Registry webhook + verification pipeline       |
| ✅ Deploy в Kubernetes / Compose | Подпись образа, SBOM, CVE-проверки             | Kyverno, Conftest, admission controller        |

---

## 🔐 Примеры Policy Enforcement

### ✅ Пример 1: Проверка подписи Docker-образа в GitLab CI

```yaml
verify-image-signature:
  image: cgr.dev/chainguard/cosign
  stage: test
  script:
    - cosign verify --key cosign.pub myregistry.com/myimage:latest
```

Можно подключить как `require` в `.gitlab-ci.yml` до деплоя — если подпись отсутствует или неверна, пайплайн завершится ошибкой.

---

### ✅ Пример 2: Проверка SBOM и политики SLSA

```yaml
verify-slsa:
  image: slsa-framework/slsa-verifier
  script:
    - slsa-verifier verify --provenance attestation.json --source github.com/myorg/myrepo --artifact myimage.tar
```

---

### ✅ Пример 3: Применение политики в Kubernetes с Kyverno

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-image-signature
spec:
  validationFailureAction: enforce
  rules:
  - name: verify-signature
    match:
      resources:
        kinds:
        - Pod
    verifyImages:
    - image: "myregistry.com/*"
      key: |-
        -----BEGIN PUBLIC KEY-----
        ...
        -----END PUBLIC KEY-----
```

> ❗Теперь любой Pod, использующий образ без нужной подписи, **не будет запущен в кластере.**

---

## 🚀 Policy Enforcement в GitLab

**Способы:**

1. ✅ GitLab CI Pipeline Policies — можно создать `.gitlab-ci.yml`, который будет применять нужные шаги (verify, check SBOM, CVE scan).
2. ✅ Merge request approvals — запретить слияние без подписи/аттестации.
3. ✅ Protected branches + custom hooks.
4. ✅ External security scanners (Snyk, Trivy, etc.) — как Gatekeeper.
5. ✅ GitLab Security Policies (Ultimate license) — позволяет задавать политики на уровне проектов и групп.

---

## 📦 А как с `docker-compose`?

Для `docker-compose` **нужно встраивать проверку подписи до запуска**, например:

```bash
cosign verify --key cosign.pub myregistry.com/myimage:latest
[ $? -ne 0 ] && echo "Image not verified!" && exit 1
docker-compose up
```

Либо использовать скрипт-обёртку:

```bash
#!/bin/bash
IMG=$(grep image docker-compose.yml | awk '{print $2}')
cosign verify --key cosign.pub "$IMG" || exit 1
docker-compose up
```

---

## 🛡️ Резюме

**Policy enforcement — ключевая часть DevSecOps**, позволяющая:

* предотвратить использование небезопасных артефактов;
* автоматизировать контроль;
* внедрить Zero Trust в supply chain.
