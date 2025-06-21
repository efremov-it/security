Juice Shop идеально подходит для отработки STRIDE-анализa, потому что:

✅ имеет **реальный веб-интерфейс**
✅ реализует **десятки уязвимостей** из OWASP Top 10
✅ легко **разворачивается в Docker**
✅ включает **автоматическую разметку угроз в UI** (если включить "CTF mode")

---

## 🚩 ПЛАН: Полный STRIDE-анализ на OWASP Juice Shop

### 🔧 **0. Развёртывание Juice Shop**

```bash
docker run --rm -p 3000:3000 bkimminich/juice-shop
```

Зайди на [http://localhost:3000](http://localhost:3000)

---

### 🧩 **1. Построим DFD (Data Flow Diagram)**

Для начала — **простая модель** логин-сервиса:

```
[User] --> [Frontend] --> [Login API] --> [Database]
```

Можем нарисовать вручную (например, draw\.io) или использовать [Microsoft Threat Modeling Tool](https://www.microsoft.com/en-us/security/blog/2018/09/24/threat-modeling-getting-started/)

для примера уже находится по пути
practice/examples/stride/login_service.dfd.txt

---

### 🧱 **2. Применим STRIDE к каждому элементу**

| Элемент       | Угроза | Пример в Juice Shop                         | Защита                         |
| ------------- | ------ | ------------------------------------------- | ------------------------------ |
| **User**      | S      | Пользователь подделывает логин (spoofing)   | CAPTCHA, 2FA                   |
|               | R      | Отказывается от действий (repudiation)      | Логирование действий           |
| **Frontend**  | T      | Подмена параметров (form tampering)         | Валидация на клиенте и сервере |
|               | I      | Отдаёт лишние данные (e.g., email в ответе) | Контроль ответа                |
| **Login API** | E      | SQLi позволяет повысить привилегии          | Prepared statements            |
|               | D      | Массивный брутфорс → DoS                    | Rate limiting                  |
| **Database**  | I      | Не шифруются пароли                         | bcrypt/argon2                  |

---

### 🧪 **3. Найдём реальные уязвимости в Juice Shop**

Juice Shop включает десятки категорий — и мы можем пройти **по каждой категории STRIDE**:

#### 📌 **Spoofing**

* Уязвимость: вход под чужим пользователем
* Пример: найти токен через `JWT debug`, вставить вручную → вход
* Проверить: `admin@juice-sh.op` — получаешь доступ без пароля

#### 🛠 **Tampering**

* Уязвимость: изменение параметров (e.g., `/rest/user/login`)
* Пример: `curl -X POST` с фальшивыми значениями

#### 🧾 **Repudiation**

* Уязвимость: нет логов действий (можно отрицать факт действия)
* Проверка: выполнить удаление товара, а потом проверить `/logs`

#### 🔐 **Information Disclosure**

* Уязвимость: видны email-адреса, пароли, конфиги
* Пример: `robots.txt`, `ftp-access.log`, `package.json` открыты

#### 🧨 **Denial of Service**

* Уязвимость: нет rate-limiting на `/rest/user/login`
* Пример: Burp Intruder с 1000 попытками → API ложится

#### 📈 **Elevation of Privilege**

* Уязвимость: смена роли через JWT
* Пример: вручную изменить `"role": "admin"` в JWT и подставить

---

### 📋 **4. Отчёт по STRIDE-анализу**

Хочешь — могу сгенерировать для тебя шаблон (Markdown или PDF), который ты сможешь использовать для своих проектов.

---

### 🤖 **5. Автоматизация анализа**

| Инструмент                     | Назначение                              |
| ------------------------------ | --------------------------------------- |
| OWASP Threat Dragon            | Визуальное моделирование DFD + STRIDE   |
| Microsoft Threat Modeling Tool | Глубокий анализ систем на базе шаблонов |
| ThreatSpec + Gherkin           | Инфраструктурный STRIDE-анализ (IaC)    |
| PyTM                           | Python DSL для моделирования угроз      |
| Burp Suite Intruder            | Автоматизация проверки DoS, Spoofing    |

---

## ✅ Что ты можешь делать дальше:

1. **В Juice Shop активируй CTF-mode**
   `http://localhost:3000/#/score-board` → "Enable CTF Mode"

2. **Для каждой категории STRIDE**:

   * Найди 1–2 примера из Juice Shop
   * Опиши: уязвимость → STRIDE → защита
   * Добавь скриншоты / curl / burp

3. **Если нужно — я помогу тебе собрать весь отчёт**

---

## Хочешь шаблон STRIDE-отчёта с примерами из Juice Shop?

📝 Могу сразу сгенерировать:

* .md файл для репозитория
* или .pdf для документации

Скажи формат — и сделаю.
https://medium.com/@oleksii.bebych/hack-the-owasp-juice-shop-application-and-protect-it-with-aws-waf-part-2-2d1d34693ee7

Видео объясняет как там работать
https://www.youtube.com/watch?v=1HrTpehfdPM&ab_channel=NDCConferences

Тут есть подсказки в самом сайте
http://localhost:3000/#/score-board


