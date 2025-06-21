Отлично, Alexander. Ниже — **улучшенная архитектура Semgrep-интеграции для GitLab CI**, без использования Semgrep Cloud. Всё заточено под **масштабируемость**, **гибкость**, **безопасность** и **легкость сопровождения**.

---

## ✅ **Улучшенный план CI-интеграции Semgrep (без Cloud)**

### 🔹 1. Центральный проект `semgrep-diff`

Это ядро всей интеграции:

#### Содержимое:

```text
semgrep-diff/
├── .gitlab-ci.yml               # CI шаблон для импорта
├── scan.sh                      # Универсальный скрипт запуска
├── rules/
│   ├── common/                  # Общие правила
│   ├── dockerfile/
│   ├── go/
│   ├── php/
│   ├── python/
│   ├── nodejs/
│   └── ruby/
├── custom/
│   └── business-logic/          # Кастомные правила под продукт
└── README.md
```

---

### 🔹 2. Скрипт `scan.sh`

```bash
#!/bin/bash
set -euo pipefail

LANGUAGE="${1:-}"
BASELINE="${2:-origin/main}"
RULES_DIR="./rules"

if [[ -z "$LANGUAGE" ]]; then
  echo "Usage: scan.sh <language>"
  exit 1
fi

# Собираем правила
CONFIGS=()
CONFIGS+=("--config=${RULES_DIR}/common")
[[ -d "${RULES_DIR}/${LANGUAGE}" ]] && CONFIGS+=("--config=${RULES_DIR}/${LANGUAGE}")

# Запуск
semgrep ci \
  "${CONFIGS[@]}" \
  --baseline-ref "$BASELINE" \
  --json > semgrep-report.json
```

---

### 🔹 3. GitLab CI шаблон `.gitlab-ci.yml` (в `semgrep-diff`)

```yaml
semgrep_scan:
  image: returntocorp/semgrep:latest
  stage: test
  variables:
    GIT_DEPTH: 0
  script:
    - ./scan.sh "$PROJECT_LANG"
  artifacts:
    paths:
      - semgrep-report.json
    expire_in: 1 day
  allow_failure: true
```

---

### 🔹 4. Как использовать в других проектах

#### В `.gitlab-ci.yml` целевого проекта:

```yaml
include:
  - project: devsec/semgrep-diff
    file: '/.gitlab-ci.yml'
    ref: main

variables:
  PROJECT_LANG: "go"  # Или php, nodejs и т.д.
```

---

### 🔹 5. Расширения и улучшения

#### 📁 Поддержка кастомных правил:

```bash
semgrep ci \
  --config rules/go \
  --config custom/business-logic/api-tokens.yaml \
  ...
```

#### 🧪 Проверка синтаксиса всех правил (lint):

```yaml
semgrep_lint:
  image: returntocorp/semgrep:latest
  script:
    - semgrep --validate rules/
```

---

## 📌 **Best practices GitLab-only использования Semgrep**

| Подход                     | Практика                                                     |
| -------------------------- | ------------------------------------------------------------ |
| Храни кастомные правила    | В `custom/` и версионируй через MR-review                    |
| Настрой baseline анализ    | `--baseline-ref origin/main` для pull request анализов       |
| Автотесты кастомных правил | Используй `semgrep test` (можно сделать отдельный `test.sh`) |
| Общие шаблоны              | Выноси `.gitlab-ci.yml` и скрипты в shared CI проект         |
| Безопасное использование   | Не подгружай правила из внешнего `--config` без проверки     |
| Локальный запуск           | Поддержи `make scan LANG=go` или `docker run -v ...`         |
| Храни отчёты               | В GitLab artifacts, но на короткий срок (1 день)             |

---

## 🧠 Пример кастомного правила (Dockerfile)

```yaml
rules:
  - id: no-sudo-docker
    languages: [dockerfile]
    pattern: RUN sudo ...
    message: "Avoid using sudo in Dockerfile — not needed for non-root base images."
    severity: WARNING
    metadata:
      category: security
```

---

## 📈 Как делают большие компании (GitLab-only)

* **Google/Facebook:** используют Semgrep в виде self-hosted (либо CI-only), полностью без Cloud.
* **GitLab:** рекомендует хранить правила отдельно и переиспользовать `.gitlab-ci.yml` между проектами.
* **Datadog/Shopify:** кастомизируют правила по языкам и бизнес-контексту, CI запускается только на diff.
* **Slack:** кастомизирует правила и валидирует каждое правило через `semgrep test`.

---

## ✅ Что ещё можно добавить?

* [ ] **Makefile**: `make scan LANG=go`
* [ ] **pre-commit hook**: локальный запуск перед коммитом
* [ ] **отдельный job для `semgrep test`** в `MR`
* [ ] **отчёт в markdown** — превращение `semgrep-report.json` в читаемый вид (через jq/python)

---

Если хочешь, я могу подготовить шаблон `semgrep-diff` GitLab-проекта с полным CI и парой кастомных правил. Скажи только, на каком языке хочешь пример (Go, Node, Ruby и т.д.) и нужно ли `Makefile`/pre-commit.
