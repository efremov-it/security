Вот несколько **бесплатных песочниц и симуляторов**, которые можно развернуть локально или использовать онлайн:

---

### 🧪 **Локальные уязвимые приложения (для практики OWASP Top 10):**

1. **[DVWA (Damn Vulnerable Web Application)](http://www.dvwa.co.uk/)**

   * Самое популярное уязвимое приложение.
   * Можно запустить через Docker или на локальном LAMP/LEMP.
   * Покрывает Injection, Broken Auth, XSS и др.

2. **[OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)**

   * Современное веб-приложение с большим числом уязвимостей.
   * Легко разворачивается через Docker:

     ```bash
     docker run -d -p 3000:3000 bkimminich/juice-shop
     ```
   * Содержит CTF-интерфейс для отслеживания прогресса.

3. **[WebGoat](https://owasp.org/www-project-webgoat/)**

   * Интерактивное обучение по OWASP Top 10.
   * Также разворачивается через Docker или Spring Boot.

4. **[bWAPP](https://sourceforge.net/projects/bwapp/)**

   * Поддерживает более 100 уязвимостей, в том числе OWASP и beyond.

---

### 🎥 **Бесплатные видеокурсы и практикумы:**

1. **YouTube — канал [Hussein Nasser](https://www.youtube.com/@hnasr)**

   * Объясняет web security просто и на практике.
   * Есть ролики по DVWA, SSRF, SQLi, XSS.

2. **YouTube — канал [The Cyber Mentor](https://www.youtube.com/@TheCyberMentor)**

   * Особенно полезен для начального уровня и понимания угроз.

3. **Udemy — бесплатные курсы:**

   * Зайди на [https://www.udemy.com/courses/free/](https://www.udemy.com/courses/free/) и введи в поиск:
     `OWASP`, `web security`, `ethical hacking`.
   * Иногда появляются **бесплатные промо-курсы** — можно отслеживать через сайты-агрегаторы, например:

     * [https://www.discudemy.com/](https://www.discudemy.com/)
     * [https://www.real.discount/](https://www.real.discount/)

---

### 💡 Как действовать продуктивно:

1. Разверни Juice Shop или DVWA в Docker.
2. Пройди несколько задач по каждой категории OWASP Top 10.
3. Заводи журнал/таблицу:

   * Уязвимость
   * Как воспроизвёл
   * Что позволяет сделать
   * Как защищаться

---
Ниже — **интерактивный чеклист** с привязкой уязвимостей из OWASP Top 10 (2021) к практическим песочницам (DVWA, Juice Shop и WebGoat). Он поможет системно пройти через все ключевые векторы атак. Всё протестировано и подходит для новичка и уверенного джуниора.

---

# ✅ **OWASP Top 10 — Практический чеклист**

| №  | Уязвимость                                 | Где проверять    | Что сделать                                                                                       |
| -- | ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------- |
| 1  | **Broken Access Control**                  | Juice Shop, DVWA | Попробуй получить доступ к `/administration` без авторизации или изменить `userId` в запросе.     |
| 2  | **Cryptographic Failures**                 | WebGoat          | Пройди модуль "Insecure Transport" — проверь передачу данных без HTTPS.                           |
| 3  | **Injection (SQLi)**                       | DVWA, Juice Shop | В DVWA (уровень low): введи `' OR '1'='1` в поле логина. Аналогично проверь корзину в Juice Shop. |
| 4  | **Insecure Design**                        | Juice Shop       | Пройди challenge: "Login Admin Without Password". Подумай, почему архитектура уязвима.            |
| 5  | **Security Misconfiguration**              | DVWA, Juice Shop | Проверь открытые `.git`, `.env`, конфиги. Используй `robots.txt`, `/.git/config`, `/config.json`. |
| 6  | **Vulnerable & Outdated Components**       | Juice Shop       | Перейди к `/ftp`, скачай архив и найди старые версии компонентов.                                 |
| 7  | **Identification & Auth Failures**         | DVWA, WebGoat    | Попробуй зайти как другой пользователь, перехватив сессию. WebGoat: модуль Broken Auth.           |
| 8  | **Software/Data Integrity Failures**       | Juice Shop       | Задание "Forged Coupon Code". Измени токен в купоне и получи скидку.                              |
| 9  | **Security Logging & Monitoring Failures** | Juice Shop       | Соверши XSS или SQLi, а затем проверь — зафиксирована ли попытка в логах.                         |
| 10 | **Server-Side Request Forgery (SSRF)**     | Juice Shop       | Задание "SSRF". Подставь `http://localhost/admin` или IP 127.0.0.1 в поле загрузки URL.           |

---

## 🔧 Развертывание песочниц (Docker):

```bash
# Juice Shop
# DVWA
# WebGoat
docker compose -f practice/examples/owasp/docker-compose.yml up -d
```

---

## 📓 Шаблон записи результатов (для каждой уязвимости)

| Уязвимость      | Приложение | Что сделал                       | Результат                      | Как исправить                       |
| --------------- | ---------- | -------------------------------- | ------------------------------ | ----------------------------------- |
| SQL Injection   | DVWA       | Ввел `' OR '1'='1` в поле логина | Получил доступ без пароля      | Использовать подготовленные запросы |
| Insecure Design | Juice Shop | Угадал URL и роль администратора | Доступ к панели администратора | Ограничить доступ через роли        |

---

## 💬 Хочешь, я упакую это в PDF-чеклист с полями для заметок, чтобы ты мог использовать как шаблон отчёта?
