Отлично, Александр! Давай детально разложим план внедрения **Kubernetes security-сканирования (kube-scan)** на **неделю 5**, включая:

> ✅ CI-интеграцию
> ✅ Настройки
> ✅ Частоту
> ✅ Хранение и автоматизацию отчетов

---

# 🧭 kube-scan: План внедрения компонентов Kubernetes security-анализа

## ✅ Цели:

* Автоматизировать запуск security-инструментов через CI/CD
* Обеспечить регулярный аудит безопасности кластера и манифестов
* Хранить отчеты централизованно и прозрачно

---

## 🔍 1. **kube-bench** (CIS-бенчмарк сканер)

### 📦 Что делает:

Проверяет **настройки нод и компонентов Kubernetes** (apiserver, kubelet и т.д.) по стандарту CIS.

---

### 🔧 Внедрение через CI/CD

**❗Важно:** требуется **запуск с доступом к хосту**, поэтому:

| Запуск            | Где?        | Как?                                                                                                                  |
| ----------------- | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| Один раз на хосте | CronJob     | `docker run --rm --pid=host --net=host -v /etc:/etc:ro -v /var:/var:ro aquasec/kube-bench:latest`                     |
| На кластере       | `DaemonSet` | Использовать [официальный манифест kube-bench DS](https://github.com/aquasecurity/kube-bench/tree/main/job-templates) |

```bash
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job-templates/daemonset.yml
```

---

### ⚙️ Настройки:

* Версия Kubernetes (`--version 1.23`, `1.26`, и т.д.)
* Опции хранения: `-o json` или `-o junit`
  Например:

  ```bash
  kube-bench --version 1.26 -o json > kube-bench.json
  ```

---

### 🔁 Частота:

* **Раз в неделю** (например, через GitLab CI, cron или `CronJob` в k8s)
* После апгрейда компонентов или kubelet

---

### 📁 Хранение отчетов:

* **GitLab artifacts**, S3 (Minio), Loki/Grafana (если логируется)
* Или отправка в SIEM/ELK через `log forwarder`

---

## 🕵️‍♂️ 2. **kube-hunter** (поиск атакующих векторов)

### 📦 Что делает:

Проверяет кластер на **доступность атакующих поверхностей** — API без auth, kubelet порты, etcd, dashboard, и т.п.

---

### 🔧 Внедрение:

* **Remote режим**: из CI или локально с указанием IP кластера:

  ```bash
  docker run --rm -it aquasec/kube-hunter --remote <cluster-ip>
  ```

* **Internal mode** (внутри кластера): запуск Pod с автоматическим сканированием:

  ```bash
  kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-hunter/main/job.yaml
  ```

---

### ⚙️ Настройки:

* `--report json`
* Возможность указать IP узлов или CIDR
* Можно использовать LabelSelector для фокуса

---

### 🔁 Частота:

* **Раз в 2 недели**
* Или при открытии новых портов, ingress-ов

---

### 📁 Хранение отчетов:

* GitLab CI artifact (`kube-hunter.json`)
* Отправка в SIEM/Slack через webhook
* Email через CI pipeline (надежно и просто)

---

## 🧼 3. **Polaris** (анализ манифестов)

### 📦 Что делает:

Анализирует **манифесты Helm/Pod/Deployment** на:

* отсутствие ресурсов,
* `privileged` = true,
* `runAsRoot`,
* `pullPolicy: Always`

---

### 🔧 Внедрение:

#### Вариант 1: Локальный запуск в CI

```yaml
polaris-scan:
  image: quay.io/fairwinds/polaris:latest
  script:
    - polaris audit --audit-path ./manifests --output-format json --output-file polaris-report.json
  artifacts:
    paths:
      - polaris-report.json
```

#### Вариант 2: Dashboard в кластере

```bash
kubectl apply -f https://github.com/FairwindsOps/polaris/releases/latest/download/dashboard.yaml
```

---

### ⚙️ Настройки:

* `--set-exit-code-on-error`
* `--config` для своего `polaris.yaml` (чтобы отключить ненужные правила)

---

### 🔁 Частота:

* **На каждый Pull Request** или merge
* Также периодически `nightly` или `weekly`

---

### 📁 Хранение:

* GitLab/GitHub CI artifacts
* Вывод HTML в S3 или в GitLab Pages
* Примеры интеграции: [`polaris-html-reporter`](https://github.com/FairwindsOps/polaris#html-report)

---

## 📦 Финальная структура CI (пример: `.gitlab-ci.yml`)

```yaml
kube-bench:
  image: aquasec/kube-bench:latest
  script:
    - kube-bench --version 1.26 -o json > kube-bench-report.json
  artifacts:
    paths:
      - kube-bench-report.json
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: weekly

kube-hunter:
  image: aquasec/kube-hunter
  script:
    - kube-hunter --remote <IP> --report json > kube-hunter.json
  artifacts:
    paths:
      - kube-hunter.json
  rules:
    - when: manual

polaris:
  image: quay.io/fairwinds/polaris:latest
  script:
    - polaris audit --audit-path ./manifests --output-format json --output-file polaris.json
  artifacts:
    paths:
      - polaris.json
```

---

## 🧾 Хранилище отчетов

| Инструмент  | Отчёты          | Форматы | Рекомендации по хранению      |
| ----------- | --------------- | ------- | ----------------------------- |
| kube-bench  | `json`, `junit` | ✔       | GitLab Artifacts / S3 / SIEM  |
| kube-hunter | `json`          | ✔       | GitLab / Slack / ELK          |
| Polaris     | `json`, `html`  | ✔       | Pages / S3 / GitLab artifacts |

---

Хочешь — могу оформить всё это в `.md` файл или полноценную CI-инструкцию с шаблонами и конфигами под GitLab/GitHub.
