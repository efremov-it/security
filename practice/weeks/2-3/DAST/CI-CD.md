# Запуск тестового стенда, длля локальной ручной проверки, с последущим переносом в CI/CD
tools/docker-compose.yml
запустить обычной командой

`make`

будет поднят контейнер, в котором можно выбрать нужный скрипт автоматизации.

остановить

`make down`


________________________________

# запуск через CI/CD

> Интеграция в CI/CD не представляет особой сложности, когда у нас есть конфиг(и) и команда запуска контейнера. Тут приведен пример как запустить докер контейнер для проведения сканирования.

- Запуск проводим относительно основной директории репозитория.

```sh
cp tools/zap/configs/test/flypost_manager.yaml tools/zap/configs/zap.yaml
docker run --rm \
  -v "$(pwd)/tools/zap/scripts:/home/zap/.ZAP/scripts" \
  -v "$(pwd)/tools/zap/configs:/home/zap/.ZAP_D/configs" \
  -v "$(pwd)/tools/zap/reports:/home/zap/.ZAP_D/reports" \
  -v "$(pwd)/tools/zap/data:/home/zap/.ZAP_D/data" \
  zaproxy/zap-stable:2.16.1 \
  zap.sh -cmd \
    -autorun /home/zap/.ZAP_D/configs/zap.yaml \
    -addoninstall accessControl \
    -addoninstall ascanrulesBeta \
    -addoninstall ascanrulesAlpha \
    -addoninstall pscanrulesBeta \
    -addoninstall domxss \
    -addoninstall graphql \
    -addoninstall openapi \
    -addoninstall pscanrulesAlpha \
    -addoninstall scripts \
    -addoninstall communityScripts \
    -config api.disablekey=true \
    -config connection.sslAcceptAll=true \
    -config connection.response.body.size=50000000 \
    -config log.level=DEBUG \
    -config log.file=/tmp/logfile
```




---

## ✅ Цель: 5-шаговый DAST-флоу

| № | Цель                                   | Рекомендации                                                               |
| - | -------------------------------------- | -------------------------------------------------------------------------- |
| 1 | Ночной ZAP full scan на каждый сервис  | CronJob в GitLab CI              |
| 2 | Лёгкий ZAP-скан после деплоя на стейдж | Урезанный конфиг с быстрым spider и ограниченным active scan               |
| 3 | Алерты на критические уязвимости       | Фейлить пайп при High/Confirmed + нотификации в Slack/Email/MS Teams       |
| 4 | Централизованная визуализация отчётов  | Elastic Stack, DefectDojo, или локальный HTML-отчёт в GitLab Pages / Nexus |
| 5 | Авто-рекомендации по исправлению       | Интеграция ZAP JSON → парсинг → markdown → PR comments или issue генерация |

---

## 📦 Шаг 1: Full Scan в Cron (ночной запуск)

**Подход 1: GitLab CI (пример)**

```yaml
zap_full_scan:
  stage: security
  only:
    - schedules
  image: owasp/zap2docker-stable
  script:
    - zap.sh -cmd -autorun /zap/juice-full.yaml
  artifacts:
    paths:
      - zap/reports/
```
---

## ⚡ Шаг 2: Быстрый скан после деплоя

Создай `juice-lite.yaml`, где:

* убери `activeScan`, или оставь только `passiveScan` и `spider`:
* сократи `maxDuration`, `maxDepth`, `maxChildren`

```yaml
- type: spider
  parameters:
    maxDuration: 2
    maxDepth: 3
    maxChildren: 5

- type: passiveScan-wait
```

Смысл: **на лету проверить, что не появилось чего-то ужасного после изменений**.

---

## 🚨 Шаг 3: Алерты + fail пайпа

Ты уже добавил блок:

```yaml
- type: exitStatus
  parameters:
    errorLevel: High
    warnLevel: Medium
```

✅ Это фейлит пайп если найдена хотя бы одна `High` или `Confirmed`.

🔔 Для нотификаций:

* GitLab → `notifications:` или `curl` в Slack/Telegram/Teams
* Jenkins → Slack plugin
* GitHub Actions → `@actions/github-script` + webhook

---

## 📊 Шаг 4: Визуализация отчетов

### Вариант A: GitLab Pages (для внутренних отчетов)

```yaml
artifacts:
  paths:
    - zap/reports/
  expire_in: 30 days

pages:
  stage: deploy
  script:
    - cp -r zap/reports/ public/
  artifacts:
    paths:
      - public
```

### Вариант B: DefectDojo (рекомендуется для AppSec-отдела)

* Импортируй JSON-отчёты от ZAP
* Автоматически расставляются CWE, severity, дашборды, отчёты и тренды
* Есть API, можно пушить отчёты из пайпов

---

## 🧠 Шаг 5: Рекомендации для разработчиков

### A. Обработка JSON-отчёта

Пример обработки `zap-reports/juiceShopJsonReport.json` на Python:

```python
import json

with open("juiceShopJsonReport.json") as f:
    report = json.load(f)

for alert in report['site'][0]['alerts']:
    if alert['riskcode'] in ['2', '3']:  # Medium/High
        print(f"[{alert['riskdesc']}] {alert['name']}")
        print(f"Solution: {alert['solution']}")
        print(f"URL: {alert['instances'][0]['uri']}")
        print("—" * 40)
```

### B. Автогенерация issue / PR комментариев

* GitHub → `gh api` или GitHub Actions
* GitLab → `curl` с токеном и JSON в `/issues`
* Jira → `/rest/api/2/issue`

---

## 📁 Рекомендуемая структура репозитория с конфигами

```
zap-configs/
├── common/
│   └── auth-scripts/
├── juice/
│   ├── full.yaml
│   └── lite.yaml
├── prod-app/
│   ├── full.yaml
│   └── lite.yaml
└── run-zap.sh
```

---

## 📌 Финальные советы

| Что делать                        | Почему это важно                                    |
| --------------------------------- | --------------------------------------------------- |
| Настроить fail‑on‑high            | Лучше "сломать билд", чем оставить XSS в проде      |
| Отделить nightly и CI-проверку    | Полный скан занимает часы — CI упадёт               |
| Использовать DefectDojo или ELK   | Будет история, поиск, фильтрация, отчёты по трендам |
| Настроить шаблоны для уведомлений | У команды не будет "аллергии" на фейлы              |

---

Если хочешь, я могу:

* 💡 Подготовить шаблон `lite.yaml` по твоему `full.yaml`
* 🛠 Сгенерировать GitLab/GitHub пайп
* 📊 Настроить парсинг JSON отчётов в Markdown/Slack/Issue

Скажи — продолжим?
