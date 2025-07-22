Отлично, давай разложим **Cosign**, **Sigstore**, и **SLSA (Supply Chain Levels for Software Artifacts)** по шагам, как профессиональный DevSecOps инженер, с примерами для:

* проверки подписей на этапе **CI/CD**, **в контейнерном реестре** и **на уровне Kubernetes-деплоя (например, Helm Chart)**;
* внедрения в **GitLab CI/CD**;
* проверки, что образ был создан **аутентичным pipeline**, а не злоумышленником.

---

## 🧩 Что такое Cosign, Sigstore и SLSA

| Инструмент   | Назначение                                                       |
| ------------ | ---------------------------------------------------------------- |
| **Cosign**   | Подпись и верификация контейнерных образов и артефактов          |
| **Sigstore** | Общая экосистема вокруг безопасного хранения и проверки подписей |
| **SLSA**     | Уровневая модель надёжности Supply Chain                         |

---

## 📦 Cosign в деталях

### 🔐 Что делает Cosign?

* Подписывает образы: `docker.io/myapp:1.0`
* Сохраняет подпись в **OCI-совместимом** реестре (вместе с образом)
* Проверяет подпись по публичному ключу (или ключам в Fulcio/Keyless)

---

## 🔧 Как подписать и проверить образ

### Подпись (в CI)

```bash
cosign sign --key cosign.key docker.io/myapp:1.0
```

Создаст:

* `docker.io/myapp:1.0` — образ
* `docker.io/myapp:1.0.sig` — подпись
* `docker.io/myapp:1.0.att` — (опционально) аттестация

### Проверка (например, перед pull/deploy):

```bash
cosign verify \
  --key cosign.pub \
  docker.io/myapp:1.0
```

---

## 🔍 Где происходит проверка?

| Стадия     | Проверка подписи                           | Нужно ли иметь ключ?          |
| ---------- | ------------------------------------------ | ----------------------------- |
| В CI       | ✅ (например, в deploy-джобе)               | Да, публичный ключ            |
| В registry | ❌ (по умолчанию не проверяется)            | Не умеют проверять сами       |
| На деплое  | ✅ (например, через Kyverno/OPA/Gatekeeper) | Да, публичный ключ (в policy) |

---

## ✅ Пример: Проверка на уровне Helm Chart / Kubernetes

Допустим у нас Helm Chart, и мы хотим убедиться, что образ:

* Подписан Cosign
* Подписан **только нашим CI**

### 1. Настройка Cosign с ключами

Сгенерируй ключ:

```bash
cosign generate-key-pair
```

Сохрани `cosign.pub` в безопасное место, например, ConfigMap в k8s:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cosign-public-key
  namespace: security
data:
  cosign.pub: |
    -----BEGIN PUBLIC KEY-----
    ...
```

---

### 2. Пример политики Kyverno: проверка подписи

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signature
spec:
  validationFailureAction: enforce
  background: false
  rules:
    - name: require-signed-images
      match:
        any:
          - resources:
              kinds: ["Pod"]
      verifyImages:
        - image: "docker.io/myorg/*"
          key: |
            -----BEGIN PUBLIC KEY-----
            ...
          attestations:
            - name: slsa-attestation
              predicateType: https://slsa.dev/provenance/v0.2
              conditions:
                - all:
                    - key: "{{ .builder.id }}"
                      operator: Equals
                      value: "https://gitlab.com/mygroup/myproject/.gitlab-ci.yml@refs/heads/main"
```

Эта политика:

* Требует, чтобы образ из `docker.io/myorg/` был подписан нашим ключом
* Требует, чтобы SLSA provenance (`.att`) содержал CI source

---

## 🔁 Как это связать с SLSA и attestations?

### Что такое attestation?

Это JSON-документ, прикрепляемый к образу, описывающий **как, где и кем** он был собран.

Пример команды:

```bash
cosign attest --predicate slsa-provenance.json --key cosign.key docker.io/myapp:1.0
```

Пример `slsa-provenance.json`:

```json
{
  "builder": {
    "id": "https://gitlab.com/myorg/project/.gitlab-ci.yml@refs/heads/main"
  },
  "buildType": "https://gitlab.com/gitlab-ci",
  "invocation": {
    "configSource": {
      "uri": "git+https://gitlab.com/myorg/project",
      "digest": {
        "sha1": "..."
      }
    }
  }
}
```

---

## 🛠️ Как это всё внедрить в GitLab CI/CD

### 1. Шаг подписания в `.gitlab-ci.yml`

```yaml
stages:
  - build
  - sign
  - deploy

variables:
  COSIGN_PASSWORD: "${COSIGN_PASSWORD}"  # secret

build-image:
  stage: build
  image: docker:20.10
  script:
    - docker build -t docker.io/myorg/app:$CI_COMMIT_SHA .
    - docker push docker.io/myorg/app:$CI_COMMIT_SHA

sign-image:
  stage: sign
  image: cgr.dev/chainguard/cosign
  script:
    - cosign sign --key cosign.key docker.io/myorg/app:$CI_COMMIT_SHA
    - cosign attest --predicate slsa.json --key cosign.key docker.io/myorg/app:$CI_COMMIT_SHA
```

### 2. Интеграция с Kubernetes Policy Engine

На проде ты **автоматически проверяешь** через Kyverno или OPA, что:

* Образ подписан
* Подписан именно твоим CI
* Образ не мутировал

---

## 📈 Почему это важно?

| Без подписи                 | С подписями (Cosign + SLSA)              |
| --------------------------- | ---------------------------------------- |
| Нет доверия к образу        | Подпись гарантирует подлинность          |
| Любой может подменить образ | Валидация предотвращает деплой фальши    |
| Нет истории сборки          | Есть attestation и цепочка происхождения |

---

## 🔐 Vault/SOPS и секреты

Ты можешь **всё это дополнительно защитить**, шифруя:

* приватный ключ `cosign.key` через SOPS и KMS (или Vault)
* добавляя этапы дешифровки в CI с логированием доступа

---

## 📋 Вывод

Если коротко:

| Компонент       | Что делает                                      | Где внедрять                            |
| --------------- | ----------------------------------------------- | --------------------------------------- |
| **Cosign**      | Подписывает и проверяет образы                  | CI, Deploy, Policy                      |
| **Sigstore**    | Обеспечивает keyless-подписи, публичные журналы | Альтернатива ручному управлению ключами |
| **SLSA**        | Обеспечивает аудит происхождения                | CI → Attestation → Kubernetes           |
| **Kyverno/OPA** | Внедряет политику проверки                      | В admission webhook (кластер)           |

