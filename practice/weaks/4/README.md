# Внедрение kics в пайпы
```yaml
kics-scan:
  image:
    name: checkmarx/kics:v2.1.5-alpine
    entrypoint: [""]
  variables:
    KICS_LOGLEVEL: INFO
    EXCLUDE_FILES: "node_modules,venv,__pycache__,.terraform,.git,build,dist"
  script:
    - kics scan -p . -o kics_results --report-formats json,html \
      --exclude-paths ${EXCLUDE_FILES} \
      --log-level ${KICS_LOGLEVEL}
```

* **анализировать Dockerfile и Helm-чарты на уязвимости и плохие практики**,
* **внедрить проверку в CI**,
* **и получить репорт в удобных форматах (`json`, `html`)**.

---

## ✅ Что ты этим покрываешь:

| Цель               | Покрыто? | Подробности                                                                                 |              |
| ------------------ | -------- | ------------------------------------------------------------------------------------------- | ------------ |
| Анализ Helm-чартов | ✅        | KICS поддерживает `.yaml`, `.tpl`, `.helm`, ищет RBAC, привилегии, отсутствие limits и т.д. |              |
| Анализ Dockerfile  | ✅        | KICS проверяет команды, root, токены, `latest`, \`curl                                      | bash\`, etc. |
| Best Practices     | ✅        | Всё, что связано с безопасностью и конфигурацией — покрыто правилами KICS                   |              |
| CI-интеграция      | ✅        | Готово к использованию в GitLab CI                                                          |              |

---

## 🔧 Рекомендации по улучшению (если хочешь усилить):

1. **Отчет сохранить как артефакт в CI:**

   ```yaml
   artifacts:
     paths:
       - kics_results
   ```

2. **Fail pipeline при критичных находках (опционально):**

   ```yaml
   script:
     - |
       kics scan -p . -o kics_results --report-formats json \
         --fail-on HIGH,CRITICAL \
         --exclude-paths ${EXCLUDE_FILES} \
         --log-level ${KICS_LOGLEVEL}
   ```

3. **Дополнительно к KICS (по желанию):**

   * `hadolint Dockerfile` — глубже смотрит на синтаксис Dockerfile
   * `helm lint charts/` — чтобы проверить корректность самих Helm шаблонов

---

### ✅ Итого

> Твоя задача "анализ Helm-чартов и Dockerfile на уязвимости + best practices" **может считаться выполненной**, если KICS запущен в таком виде.

Если хочешь — могу подготовить markdown-отчёт по этой неделе в DevSecOps-план.
