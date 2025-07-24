**подробный план изучения пентест-инструментов (недели 11–12)**, адаптированный под **DevSecOps Senior уровень**, с акцентом на:

* Практику и документацию,
* Интеграцию в CI/CD пайплайны и инфраструктуру,
* Анализ рисков и управление уязвимостями,
* Построение Zero Trust и shift-left подходов.

---

## 🧠 **Цель блока:**

Освоить инструменты тестирования безопасности и уметь **встраивать их в DevSecOps процессы**, включая SAST/DAST, инфраструктурный аудит и контроль на уровне кластеров.

---

## 🗓️ **Общий план на недели 11–12**

### 📍**Неделя 11: Инфраструктурный и сетевой аудит**

---

### 🛠 **День 1–2: Nmap (сетевое сканирование)**

#### 🎯 Цели:

* Выявить открытые порты, сервисы и версии.
* Проверка firewall/IPS правил в Dev/Stage средах.

#### 🔧 Задания:

* Выполнить сканирование своей инфраструктуры:

  ```bash
  nmap -A -Pn -T4 -p- -oA scan_results 192.168.0.0/24
  ```
* Провести **обход фаерволов**:

  ```bash
  nmap -f -D RND:10 192.168.1.1
  ```

#### 📄 Документация:

* Записать, какие порты не нужны (минимизация attack surface).
* Отчет в формате Markdown + таблица "обнаруженные сервисы" vs "необходимые".

---

### 🛠 **День 3–4: Wireshark (анализ трафика)**

#### 🎯 Цели:

* Захват и анализ HTTPS, DNS, LDAP, OAuth трафика.
* Анализ **слабых конфигураций TLS, явных токенов** в трафике.

#### 🔧 Задания:

* Захват трафика между Keycloak ↔ Vault.
* Проанализировать:

  * TLS версии
  * OIDC токены в `Authorization: Bearer`
* Фильтры:

  ```wireshark
  http.authorization
  tls.handshake.version
  ```

#### 📄 Документация:

* Примеры найденных потенциально опасных данных.
* Выводы о необходимости TLS 1.3, HSTS, MTLS и т.д.

---

### 🛠 **День 5–6: SQLMap + Nikto (автоматизация)**

#### 🎯 Цели:

* Автоматизированный анализ веб-приложений на SQLi, XSS.
* Проверка базовых misconfiguration в nginx, Apache, etc.

#### 🔧 Задания:

* Использовать SQLMap на демо-приложении с формами входа:

  ```bash
  sqlmap -u "http://demo.local/login.php?user=admin" --batch --dbs
  ```
* Прогнать Nikto:

  ```bash
  nikto -h http://demo.local
  ```

#### 📄 Документация:

* Отчет о найденных уязвимостях.
* Предложения для Dev-команды: убрать `X-Powered-By`, `Server`, настроить WAF.

---

### 📍 **Неделя 12: DAST, эксплуатация, и Red Team-подход**

---

### 🛠 **День 1–2: Metasploit Framework**

#### 🎯 Цели:

* Понять принцип создания эксплойтов и payload'ов.
* Использовать готовые модули на тестовых хостах.

#### 🔧 Задания:

* Поднять Metasploitable 2 / DVWA.
* Эксплуатировать уязвимости с помощью:

  ```bash
  use exploit/unix/ftp/vsftpd_234_backdoor
  set RHOST 192.168.1.100
  run
  ```

#### 📄 Документация:

* Как использовать Metasploit в безопасных средах (CI-проверки + локальный Dev Cluster).
* Модульная структура Metasploit, список часто используемых модулей.

---

### 🛠 **День 3–4: Burp Suite + DAST Pipeline**

#### 🎯 Цели:

* Тестировать безопасность API и веб-интерфейсов.
* Перехватывать и модифицировать трафик.
* Интеграция Burp CLI (DAST) в GitLab CI.

#### 🔧 Задания:

* Перехватить вход по OIDC, захват токена.
* Попробовать SSRF, XSS на своих сервисах.
* Настроить [Burp Suite CI](https://portswigger.net/burp/application-security-testing/automated-scan) или использовать бесплатный CLI-аналог — OWASP ZAP.

#### 📄 Документация:

* Подготовить DAST CI pipeline (например, `.gitlab-ci.yml`):

  ```yaml
  dast:
    image: owasp/zap2docker-stable
    script:
      - zap-baseline.py -t http://your-app.local -r report.html
  ```

---

### 🛠 **День 5–6: TryHackMe или HackTheBox (реальная эксплуатация)**

#### 🎯 Цели:

* Повторение и закрепление полученных навыков.
* Минимум 3 машины:

  * 1 web+SQL
  * 1 LDAP+RBAC
  * 1 JWT+OAuth

#### 🔧 Задания:

* Зарегистрироваться и пройти комнату:

  * TryHackMe: `OWASP Top 10`, `JWT`, `Vault Room`
  * HackTheBox: `Inject`, `Node`, `Jewel`

#### 📄 Документация:

* Скриншоты прохождения.
* Краткое описание уязвимости + как бы вы её заблокировали на DevSecOps уровне.

---

## 🗂️ **Формат финальной документации**

Создай репозиторий `devsecops-pentest-lab` со следующей структурой:

```text
devsecops-pentest-lab/
├── README.md
├── nmap/
│   └── scan_report.md
├── wireshark/
│   └── tls_analysis.md
├── metasploit/
│   └── exploit_notes.md
├── sqlmap_nikto/
│   └── findings.md
├── burp_zap/
│   └── api_security_checks.md
├── tryhackme/
│   └── jwt_exploitation.md
└── cicd/
    └── dast-pipeline.gitlab-ci.yml
```
