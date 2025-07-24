**план на недели 5–6**, разбитый по направлениям, задачам и инструментам, с акцентом на практику DevSecOps-инженера.

---

# ☸️ **Недели 5–6: Kubernetes и инфраструктурная безопасность**

Цель: **Понять и реализовать безопасную базу в Kubernetes-кластере**, проверить текущие манифесты и начать применять политики безопасности.

---

## 📅 **Неделя 5: Аудит и сканирование кластера**

### 🔍 1. kube-bench — проверка CIS-бенчмарка
- **Что делает**: проверяет настройки kubelet, apiserver, scheduler и т.д. по [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
- ✅ **Установить и запустить**:
  ```bash
  docker run --rm --pid=host --net=host \
    -v /etc:/etc:ro -v /var:/var:ro \
    aquasec/kube-bench:latest --version 1.23
  ```
- 📌 **Результат**: список рекомендаций по конфигурации и безопасности компонентов кластера

---

### 🕵️ 2. kube-hunter — поиск внешних атакующих векторов
- **Что делает**: активный и пассивный сканинг атакующих путей (API, etcd, kubelet, dashboard)
- ✅ **Пример запуска**:
  ```bash
  docker run --rm -it aquasec/kube-hunter --remote <node-ip>
  ```
- 📌 **Результат**: список потенциальных векторов атак извне

---

### 🧼 3. Polaris — анализ YAML-манифестов
- **Что делает**: находит ошибки в спецификациях Pod'ов:
  - отсутствие `resources`
  - `runAsRoot: true`
  - `privileged: true`
- ✅ **Установка**:
  ```bash
  kubectl apply -f https://github.com/FairwindsOps/polaris/releases/latest/download/dashboard.yaml
  ```
  или в CI:
  ```bash
  docker run -v $(pwd):/project quay.io/fairwinds/polaris:latest audit
  ```
- 📌 **Результат**: HTML/CLI-отчёт по манифестам

---

## 📅 **Неделя 6: Углубление в контроль доступа и политики**

### 🛡️ 4. RBAC и ограничение прав
- **Изучить**:
  - `Role`, `ClusterRole`, `RoleBinding`, `ServiceAccount`
  - Принцип "наименьших привилегий"
- ✅ **Практика**:
  - Создать отдельную SA с доступом только к нужным namespace
  - Проверить текущие привилегии через `kubectl auth can-i`
  - Ограничить админские роли (нет `cluster-admin` где не нужно)

---

### 🌐 5. NetworkPolicies — контроль сетевого взаимодействия
- **Изучить**:
  - `deny all` политика по умолчанию
  - `allow from namespace` / `app` / `podSelector`
- ✅ **Применить**:
  - Написать политики, запрещающие всё, кроме нужных связей
  - Проверить `networkpolicy` enforcement (Calico, Cilium, etc.)

---

### 📜 6. Audit Logs — логирование действий
- **Проверить**, что:
  - `audit-log-path` включён
  - Уровень логирования = `Metadata`, `Request`, `RequestResponse`
- ✅ **Примеры**:
  - Найти доступы `kubectl exec`, `create pod`, `delete role`
  - Настроить отправку логов в Fluent Bit/Elasticsearch/Logstash

---

### 🔐 7. Kyverno или Gatekeeper — политики безопасности

#### 🧩 **Kyverno** (проще в освоении):
- ✅ Установка:
  ```bash
  kubectl create -f https://raw.githubusercontent.com/kyverno/kyverno/main/config/release/install.yaml
  ```
- ✅ Примеры политик:
  - Отклонять Pod без `runAsNonRoot: true`
  - Запретить pull образов с `latest`
  - Применять `resource limits` по умолчанию

#### 📐 **Gatekeeper** (через OPA Rego):
- Более мощный, но требует Rego-логики
- Используется в enterprise и для более гибких политик

---

## 📊 **Итог недели 6 — чеклист**

| Направление | Проверено / Настроено |
|-------------|------------------------|
| kube-bench | ✅ |
| kube-hunter | ✅ |
| Polaris | ✅ |
| RBAC review | ✅ |
| NetworkPolicies | ✅ |
| Audit лог | ✅ |
| Kyverno/Gatekeeper | ✅ |

---
