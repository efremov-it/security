## 📅 **Неделя 6: Углубление в контроль доступа и политики**

---

### 🛡️ **4. RBAC и ограничение прав**

#### 🔍 Что это

**RBAC (Role-Based Access Control)** в Kubernetes позволяет задавать, **кто (subject)** и **что может делать (verbs)** с **чем (resources)**.

#### 📚 Основные сущности

| Объект               | Назначение                                                    |
| -------------------- | ------------------------------------------------------------- |
| `Role`               | Права в **одном namespace**                                   |
| `ClusterRole`        | Права **на уровне всего кластера** (или несколько namespaces) |
| `RoleBinding`        | Привязывает `Role` к пользователю/группе/SA                   |
| `ClusterRoleBinding` | Привязывает `ClusterRole`                                     |
| `ServiceAccount`     | Учётка для работы внутри кластера                             |

---

#### ✅ Пример: SA с доступом **только к чтению Pod-ов в namespace `dev`**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: readonly-sa
  namespace: dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: dev
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: dev
subjects:
- kind: ServiceAccount
  name: readonly-sa
  namespace: dev
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

#### 🔎 Проверка через `kubectl auth can-i`

```bash
# Пример: можно ли создавать поды от имени SA
kubectl auth can-i create pods --as=system:serviceaccount:dev:readonly-sa -n dev
```

---

#### 🔒 Ограничения: избежать `cluster-admin` в CI

```bash
kubectl get clusterrolebinding | grep cluster-admin
kubectl describe clusterrolebinding <name>
```

🔧 **Цель** — не использовать `cluster-admin` в автоматических сервисах. Лучше создавать `ClusterRole` с минимальным набором прав.

---

### 🌐 **5. NetworkPolicies — контроль сетевого взаимодействия**

#### 🔍 Что это

Позволяет **ограничить** сетевые соединения **между Pod-ами и/или внешним миром**.

Работает **только при наличии поддерживающего CNI** (Calico, Cilium, Antrea и др.)

---

#### 🧱 Базовая структура `NetworkPolicy`

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: dev
spec:
  podSelector: {}   # Все Pod-ы
  policyTypes:
  - Ingress
  - Egress
```

Это **блокирует всё** (вход/выход) для Pod-ов в namespace `dev`.

---

#### ✅ Разрешить вход только из `namespace: logging`

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-logging
  namespace: dev
spec:
  podSelector:
    matchLabels:
      app: my-backend
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          team: logging
  policyTypes:
  - Ingress
```

> 🔐 Комбинируется с `deny-all`, чтобы только `logging` namespace мог обращаться к `my-backend`.

---

#### 🧪 Проверка

```bash
# Проверка connectivity внутри кластера
kubectl run -it --rm test --image=busybox -- sh
# ping pod IP / curl service
```

Можно также использовать инструменты: **`netshoot`, `kubectl exec curl`, Cilium Hubble**, Calico Flow Logs.

---

### 📜 **6. Audit Logs — логирование действий**

#### 🔍 Что это

Kube-apiserver может вести **audit trail** всех запросов — от `kubectl`, CI-систем, сервисов и т.д.

---

#### 📁 Как включить

В kube-apiserver нужно:

```yaml
--audit-policy-file=/etc/kubernetes/audit-policy.yaml
--audit-log-path=/var/log/kubernetes/audit.log
--audit-log-maxage=30
--audit-log-maxbackup=10
--audit-log-maxsize=100
```

---

#### 📜 Пример audit-политики

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: Metadata
  verbs: ["create", "delete", "update"]
  resources:
  - group: "" # core API group
    resources: ["pods", "secrets", "configmaps"]
- level: RequestResponse
  verbs: ["create"]
  resources:
  - group: "apps"
    resources: ["deployments"]
- level: None
  users: ["system:kube-proxy"]
```

> 📌 Отдельные уровни: `None`, `Metadata`, `Request`, `RequestResponse`

---

#### ✅ Примеры анализа

```bash
# Найти exec-подключения
grep "verb\":\"create\".*\"subresource\":\"exec\"" /var/log/kubernetes/audit.log

# Найти удаление ролей
grep "delete\".*\"resource\":\"roles\"" /var/log/kubernetes/audit.log
```

---

#### 📤 Интеграция с лог-системами

1. **Файл** `/var/log/kubernetes/audit.log`
2. Агент (Fluent Bit / Fluentd / Vector)
3. Отправка в **Elasticsearch**, **Loki**, **SIEM (Wazuh, Splunk)**

Пример Fluent Bit конфигурации:

```ini
[INPUT]
    Name tail
    Path /var/log/kubernetes/audit.log
    Tag kube.audit

[OUTPUT]
    Name  es
    Match kube.*
    Host  elasticsearch.kube.local
    Port  9200
```
