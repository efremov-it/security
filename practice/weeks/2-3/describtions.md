1. **К какому классу относится**: SAST / DAST / RASP / Container Scanner
2. **Для чего предназначен**
3. **Какую роль играет в CI/CD пайплайне**

---

## 📊 Таблица по инструментам

| Инструмент     | Категория                     | Назначение                                                                                       | Где применяется в CI/CD                                  |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **Trivy**      | ✅ Container Scanner<br>✅ SAST | Сканирование уязвимостей в контейнерах, образах, зависимостях, IaC (Terraform, Dockerfile и др.) | На этапе сборки (build) образа, перед пушем или деплоем  |
| **Grype**      | ✅ Container Scanner           | Альтернатива Trivy, также ищет CVE в образах и пакетах                                           | Аналогично Trivy — скан перед публикацией образа         |
| **SonarQube**  | ✅ SAST                        | Глубокий статический анализ исходного кода: баги, уязвимости, качество                           | После этапа тестов, либо как отдельный шаг — анализ кода |
| **OWASP ZAP**  | ✅ DAST                        | Динамический анализ веб-приложения — проверка уязвимостей при работе                             | На стадии staging/post-deploy — скан живого приложения   |
| **Gitleaks**   | ✅ SAST (Secrets)              | Поиск секретов (токены, ключи, пароли) в Git-репозиториях                                        | До сборки, при push'е в репозиторий или в pre-commit     |
| **Semgrep**    | ✅ SAST                        | Лёгкий анализ исходного кода на паттерны уязвимостей, пишутся кастомные правила                  | После checkout, до/после unit-тестов                     |
| **TruffleHog** | ✅ SAST (Secrets)              | Глубокий поиск утекших секретов, включая историю коммитов                                        | Перед merge, либо периодически в фоне                    |

---

## 📌 Объяснение по категориям

### 🔒 **SAST (Static Application Security Testing)**

* Анализ кода, конфигураций, git-истории **до запуска приложения**
* Тулзы: **Semgrep**, **SonarQube**, **Gitleaks**, **TruffleHog**, **частично Trivy**

### 🌐 **DAST (Dynamic Application Security Testing)**

* Тестирует **работающее** приложение как "чёрный ящик"
* Ищет XSS, SQLi и прочие runtime-уязвимости
* Тулзы: **OWASP ZAP**

### 📦 **Container/Image Scanner**

* Проверяет образы на известные CVE, уязвимости в пакетах
* Тулзы: **Trivy**, **Grype**

### 🛡️ **RASP (Runtime Application Self-Protection)**

* Инструменты, внедряемые **в само приложение** (агенты) для защиты во время выполнения
* В списке пока нет RASP-инструментов. Для RASP можно позже рассмотреть:

  * **Contrast Security**, **Sqreen (Datadog)**, **AppArmor** (частично)

---

## 🛠️ Пример пайплайна DevSecOps (упрощённый)

```yaml
stages:
  - lint
  - sast
  - test
  - build
  - scan
  - deploy
  - dast

# Пример шагов

gitleaks:
  stage: sast
  script:
    - gitleaks detect --source . --report-format json
  allow_failure: false

semgrep:
  stage: sast
  script:
    - semgrep ci

trufflehog:
  stage: sast
  script:
    - trufflehog git file://. --json

sonarqube:
  stage: sast
  script:
    - sonar-scanner

trivy-image-scan:
  stage: scan
  script:
    - trivy image myapp:latest

zap-scan:
  stage: dast
  script:
    - zap-baseline.py -t http://staging.myapp.local
```

---

## ✅ Резюме по ролям

| Роль                             | Инструменты              |
| -------------------------------- | ------------------------ |
| Статический анализ кода          | SonarQube, Semgrep       |
| Поиск секретов в Git             | Gitleaks, TruffleHog     |
| Анализ уязвимостей в контейнерах | Trivy, Grype             |
| Динамический анализ (в рантайме) | OWASP ZAP                |
| Защита на уровне рантайма (RASP) | *(Можно внедрить позже)* |
