---
* Что такое Kyverno
* Зачем он нужен
* Как его внедрять
* Как администрировать
* Преимущества и недостатки

---

## 🔹 Что такое Kyverno

**Kyverno** — это Kubernetes-native policy engine, разработанный CNCF (Cloud Native Computing Foundation), предназначенный для управления политиками и обеспечением безопасности кластеров Kubernetes. Kyverno позволяет:

* Определять политики как Kubernetes-ресурсы (CRD)
* Автоматически валидировать, изменять и генерировать Kubernetes-объекты
* Без написания кода на Rego (в отличие от OPA/Gatekeeper)

---

## 🔹 Зачем нужен Kyverno

В кластере Kubernetes требуется строгий контроль над:

* **Конфигурациями приложений и инфраструктуры**
* **Безопасностью окружения**
* **Соблюдением стандартов и нормативов (compliance)**

**Kyverno решает задачи:**

| Категория             | Возможности Kyverno                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------- |
| Валидация             | Проверка конфигураций: limits, labels, securityContext                                       |
| Мутации               | Автоматическое добавление `labels`, `annotations`, `securityContext`, `initContainers` и др. |
| Генерация             | Автоматическое создание ConfigMap, Secret, RBAC и др.                                        |
| Контроль соответствия | Соответствие стандартам (например, CIS, NIST)                                                |
| Управление политиками | Policy-as-code, GitOps, шаблоны и Helm-поддержка                                             |
| Безопасность          | Запрет запуска root-контейнеров, enforce AppArmor, drop capabilities и т.п.                  |

---

## 🔹 Как внедрять Kyverno

### 1. 📦 Установка

**Способ 1 — Helm (рекомендуемый):**

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm upgrade --install kyverno kyverno/kyverno -n kyverno --create-namespace
```

**Способ 2 — Kustomize / YAML-манифест:**

```bash
kubectl create -f https://raw.githubusercontent.com/kyverno/kyverno/main/config/release/install.yaml
```

---

### 2. 📘 Написание политики

Пример политики: запрет контейнеров без `resources.requests` и `limits`:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resources
spec:
  validationFailureAction: enforce
  rules:
  - name: check-resources
    match:
      resources:
        kinds:
        - Pod
    validate:
      message: "Resources requests and limits must be specified."
      pattern:
        spec:
          containers:
          - resources:
              requests:
                cpu: "?*"
                memory: "?*"
              limits:
                cpu: "?*"
                memory: "?*"
```

---

### 3. 🚀 Внедрение в CI/CD

**GitOps:** Храните политики в Git-репозитории рядом с Helm-чартами/манифестами.

**CICD-интеграция:** Используйте `kyverno-cli` для проверки YAML-файлов на соответствие политикам:

```bash
kyverno apply policy.yaml --resource test-pod.yaml
```

---

### 4. 🔍 Аудит и отчеты

Kyverno автоматически записывает:

* Применённые политики (`ClusterPolicyReport`, `PolicyReport`)
* Нарушения и успешные применения политик

Пример:

```bash
kubectl get policyreport -A
kubectl get clusterpolicyreport
```

Интеграция с: **Grafana, Prometheus, Loki, Elasticsearch, SIEM**

---

## 🔹 Как администрировать Kyverno

### Управление политиками

* Используйте `ClusterPolicy` для глобального контроля
* Используйте `Policy` для namespace-специфичных ограничений
* Внедряйте через Helm, Kustomize, ArgoCD или FluxCD

### Отладка политик

* Используйте `kyverno test` для юнит-тестов политик
* Включайте логирование Kyverno в `DEBUG` для диагностики
* Мониторьте с помощью Prometheus (`kyverno_policies_applied`, `kyverno_policy_violations_total`)

### Ротация и обновления

* Kyverno не имеет критических сторонних зависимостей (в отличие от OPA/Gatekeeper)
* Поддерживает webhook configuration через `ValidatingWebhookConfiguration`

---

## 🔹 Преимущества Kyverno

| Преимущество                       | Описание                                           |
| ---------------------------------- | -------------------------------------------------- |
| ✅ Kubernetes-native                | Политики описываются в виде CRD (без Rego)         |
| ✅ Простота использования           | YAML, familiar to DevOps/Platform teams            |
| ✅ Расширенные функции              | Мутации, генерация объектов, встроенные переменные |
| ✅ Поддержка Helm и GitOps          | Интеграция с ArgoCD, Flux, Helm                    |
| ✅ Высокая совместимость            | Поддержка новых версий Kubernetes и API            |
| ✅ Сообщество и активная разработка | CNCF project, стабильные релизы                    |

---

## 🔻 Недостатки Kyverno

| Недостаток                            | Описание                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| ❌ Вычислительно затратен              | При enforce-политиках могут возникать задержки на webhook-валидации             |
| ❌ Меньшая гибкость по сравнению с OPA | Нет возможности сложных логических операций, как в Rego (но хватает 95% кейсов) |
| ❌ Генерация может конфликтовать       | Существуют ограничения при работе с `generate` при race conditions              |

---

## 🔹 Когда стоит использовать Kyverno

✅ Вы — **DevSecOps / Platform Engineer**, который:

* Работает с GitOps
* Не хочет учить Rego
* Хочет нативную Kubernetes-интеграцию
* Требует валидации и автоматизации шаблонов конфигурации

❌ Не стоит использовать, если:

* Требуются сверхсложные политики с логикой IF-ELSE
* Уже используется OPA и команда на нём обучена

---

## 🔹 Рекомендованные политики для DevSecOps

| Назначение           | Политика                                                 |
| -------------------- | -------------------------------------------------------- |
| Безопасность         | Запрет `privileged`, drop `capabilities`, `runAsNonRoot` |
| Контроль ресурсов    | Обязательные `resources.requests/limits`                 |
| Обязательные метки   | Наличие `app`, `team`, `env`                             |
| Мутация              | Автодобавление `seccompProfile`, `annotations`           |
| RBAC и генерирование | Автоматическое создание Role/RoleBinding                 |

---

## 🔹 Ссылки на официальную документацию и ресурсы

* 🌐 [Официальный сайт Kyverno](https://kyverno.io/)
* 📘 [Документация](https://kyverno.io/docs/)
* 🔧 [Kyverno CLI](https://kyverno.io/docs/kyverno-cli/)
* 📚 [Политики Kyverno (библиотека)](https://kyverno.io/policies/)
* 🧪 [Тестирование политик](https://kyverno.io/docs/writing-policies/testing-policies/)
* 💡 [GitHub репозиторий](https://github.com/kyverno/kyverno)

---
