План действий для сканирования приложения с 2FA (двухфакторной аутентификацией):

1. Требования для создания скрипта
Возможность программно получить 2FA-код (например, через e-mail, SMS, TOTP или API-заглушку).
Два этапа авторизации:
Ввод логина и пароля
Ввод 2FA-кода
Сохранение токена после успешной 2FA
Session management script для подстановки токена

3. Сохранение и переиспользование токена
Токен сохраняется в ScriptVars (logintoken).
TTL реализован, чтобы не делать лишних авторизаций.
Session management script подставляет токен в каждый запрос (аналогично вашему текущему скрипту).
4. Проверка работоспособности
Включите print в session management script для контроля подстановки токена.
Проверьте, что после логина и 2FA токен появляется и используется.
В ZAP History убедитесь, что все защищённые запросы содержат заголовок Authorization: Bearer ....
Проверьте, что нет массовых 401/403 в отчёте.
Если потребуется пример session management script — используйте ваш текущий, он универсален для любого токена.


# Настройка и автоматизация 2FA в OWASP ZAP

## 1. Как работает 2FA (на примере Authy)
- Пользователь вводит логин и пароль (первый фактор).
- Сервер проверяет логин/пароль и отправляет запрос на генерацию 2FA-кода (например, через Authy).
- Пользователь получает 2FA-код (через SMS, приложение Authy или e-mail) и вводит его.
- Сервер проверяет код и, если он корректен, выдаёт токен авторизации (например, JWT или session ID).

---

## 2. Что нужно для автоматизации 2FA
1. **Программный доступ к 2FA-коду:**
   - Если используется TOTP, можно сгенерировать код локально, зная секретный ключ (shared secret).
   - Если код приходит через SMS или e-mail, нужен API или заглушка для получения кода.
2. **Скрипт авторизации:**
   - Выполняет логин.
   - Получает 2FA-код.
   - Отправляет 2FA-код.
   - Сохраняет токен.
3. **Session management script:**
   - Для автоматической подстановки токена в запросы.

---

## 3. Конфигурационные файлы

### a. Контекст (context)
```yaml
authentication:
  method: script
  parameters:
    scriptEngine: "ECMAScript : Graal.js"
    authUrl: http://localhost:3000/rest/user/login
    twoFaUrl: http://localhost:3000/rest/user/2fa
    script: /home/zap/.ZAP/scripts/authentication/2FA.js
    scriptName: "2FA Auth Script"
    scriptType: "authentication"
    scriptDescription: "2FA Authentication Script"
```

b. Session management script
Используйте ваш текущий juice_shop_session.js для подстановки токена.

c. YAML-конфигурация:
Убедитесь, что все этапы (spider, spiderAjax, activeScan) используют user: internal-user и context: juiceShopContext.
4. Каким образом я смогу получать 2FA-код?
a. Если используется TOTP (например, Authy):
TOTP-код можно сгенерировать локально, если у вас есть секретный ключ (shared secret), выданный сервером при настройке 2FA.
Используйте библиотеку для генерации TOTP-кодов:
JavaScript: otplib
Пример:
``` yaml
const otplib = require('otplib');
const secret = 'ВАШ_СЕКРЕТНЫЙ_КЛЮЧ'; // Получите его при настройке 2FA
const twoFaCode = otplib.authenticator.generate(secret);
console.log('Ваш 2FA-код:', twoFaCode);
```

b. Если код приходит через SMS или e-mail:
Вам нужен API или заглушка для получения кода.
Например:
Если сервер отправляет код на e-mail, настройте тестовый почтовый сервер (например, MailHog) и читайте код из входящих писем.
Если код приходит через SMS, используйте тестовый SMS API (например, Twilio).
c. Если сервер предоставляет API для тестирования:
Некоторые приложения (например, тестовые) предоставляют API для получения 2FA-кода.
Пример:
```yaml
function get2FACode() {
    var msg = helper.prepareMessage();
    msg.getRequestHeader().setURI(new org.apache.commons.httpclient.URI('http://localhost:3000/api/2fa/test', false));
    msg.getRequestHeader().setMethod('GET');
    helper.sendAndReceive(msg);
    var responseBody = msg.getResponseBody().toString();
    var json = JSON.parse(responseBody);
    return json.code; // Предположим, сервер возвращает { "code": "123456" }
}
```

Итоговый процесс:
1. Скрипт авторизации:
- Выполняет логин.
- Получает 2FA-код (через TOTP, API или заглушку).
- Отправляет 2FA-код.
- Сохраняет токен.
2. Session management script:
- Подставляет токен в каждый запрос.
3. Конфигурация:
- Настроен контекст, пользователь и скрипты.
4. Проверка:
- Убедитесь, что токен подставляется в запросы.
- Проверьте отсутствие массовых 401/403.

otpauth://totp/OWASP%20Juice%20Shop:test@mail.com?secret=FBDUQ6TRHAIWAAAV&issuer=OWASP%20Juice%20Shop
```

- **Shared secret:** `FBDUQ6TRHAIWAAAV`  
  Это ключ, который используется для генерации TOTP-кодов. Вы можете использовать его в библиотеке `otplib` для автоматической генерации 2FA-кодов.

- **Как это работает:**
  - Shared secret остаётся неизменным для вашего аккаунта.
  - Каждый раз, когда сервер запрашивает 2FA-код, вы можете сгенерировать его локально, используя этот shared secret.

- **Если вы уже использовали QR-код:**
  - Это не проблема. QR-код просто содержит shared secret, который вы можете использовать повторно.
  - Даже если вы уже настроили приложение (например, Authy или Google Authenticator), shared secret остаётся тем же.

---

### 2. **Первоначальная настройка 2FA (пароль + 2FA-код)**

- При первом подключении сервер требует:
  1. Логин и пароль.
  2. 2FA-код, сгенерированный вашим приложением.

- **Почему это не проблема:**
  - После успешной настройки 2FA сервер больше не требует повторной настройки (если вы не сбрасываете 2FA).
  - Для автоматизации вы можете использовать shared secret для генерации кодов.

---

### 3. **Как избежать проблем с 2FA в будущем**

- **Shared secret остаётся неизменным:**  
  Вы можете использовать его для генерации кодов в любом скрипте или приложении.

- **Если сервер требует 2FA-код при каждом входе:**  
  Это стандартное поведение. Ваш скрипт должен:
  1. Выполнять логин (логин + пароль).
  2. Генерировать 2FA-код с помощью shared secret.
  3. Отправлять 2FA-код на сервер.

- **Если сервер требует сброса 2FA:**  
  Это может произойти, если вы сбросили настройки 2FA в приложении. В таком случае вам нужно будет повторно настроить shared secret.

---

### 4. **Обновление скрипта для использования shared secret**

Вот обновлённая функция `get2FACode`:

```javascript
function get2FACode() {
    const otplib = require('otplib');
    const secret = 'FBDUQ6TRHAIWAAAV'; // Shared secret из вашего QR-кода
    const twoFaCode = otplib.authenticator.generate(secret);
    print('✅ Сгенерированный 2FA-код: ' + twoFaCode);
    return twoFaCode;
}
```

5. Проверка работоспособности
Тестирование генерации 2FA-кода:

Убедитесь, что сгенерированный код совпадает с кодом в вашем приложении (Authy, Google Authenticator).
Если коды совпадают, значит shared secret используется корректно.
Тестирование авторизации:

Проверьте, что сервер принимает сгенерированный код и возвращает токен.
Отладка:

Если сервер возвращает ошибку, проверьте:
Правильность shared secret.
Синхронизацию времени на сервере и вашем устройстве (TOTP зависит от времени).
6. Вывод
Shared secret (FBDUQ6TRHAIWAAAV) можно использовать для автоматической генерации 2FA-кодов.
QR-код можно использовать повторно, он просто содержит shared secret.
Ваш скрипт должен выполнять логин, генерировать 2FA-код и отправлять его на сервер.
Если всё настроено правильно, проблем с авторизацией быть не должно.---
5. Проверка работоспособности
Тестирование генерации 2FA-кода:

Убедитесь, что сгенерированный код совпадает с кодом в вашем приложении (Authy, Google Authenticator).
Если коды совпадают, значит shared secret используется корректно.
Тестирование авторизации:

Проверьте, что сервер принимает сгенерированный код и возвращает токен.
Отладка:

Если сервер возвращает ошибку, проверьте:
Правильность shared secret.
Синхронизацию времени на сервере и вашем устройстве (TOTP зависит от времени).
6. Вывод
Shared secret (FBDUQ6TRHAIWAAAV) можно использовать для автоматической генерации 2FA-кодов.
QR-код можно использовать повторно, он просто содержит shared secret.
Ваш скрипт должен выполнять логин, генерировать 2FA-код и отправлять его на сервер.
Если всё настроено правильно, проблем с авторизацией быть не должно.

# Скрипт для проверки авторизации посредством 2FA

## Пример скрипта на Python для авторизации с 2FA

```python
import requests
import pyotp

# Shared secret из QR-кода
SECRET = "FBDUQ6TRHAIWAAAV"

# URL для логина и 2FA
AUTH_URL = "http://localhost:3000/rest/user/login"
TWO_FA_URL = "http://localhost:3000/rest/user/2fa"

# Логин и пароль
USERNAME = "test@mail.com"
PASSWORD = "password123"

# Генерация 2FA-кода с использованием pyotp
def generate_2fa_code(secret):
    totp = pyotp.TOTP(secret)
    two_fa_code = totp.now()
    print(f"✅ Сгенерированный 2FA-код: {two_fa_code}")
    return two_fa_code

# Выполнение первого этапа авторизации (логин)
def login(auth_url, username, password):
    payload = {"email": username, "password": password}
    response = requests.post(auth_url, json=payload)
    if response.status_code == 200:
        print("✅ Успешный логин")
        return response.json()
    else:
        print(f"❌ Ошибка логина: {response.status_code}")
        print(response.text)
        return None

# Выполнение второго этапа авторизации (2FA)
def send_2fa(two_fa_url, two_fa_code):
    payload = {"code": two_fa_code}
    response = requests.post(two_fa_url, json=payload)
    if response.status_code == 200:
        print("✅ Успешная 2FA")
        return response.json()
    else:
        print(f"❌ Ошибка 2FA: {response.status_code}")
        print(response.text)
        return None

# Основной процесс авторизации
def main():
    # Первый этап: логин
    login_response = login(AUTH_URL, USERNAME, PASSWORD)
    if not login_response:
        return

    # Генерация 2FA-кода
    two_fa_code = generate_2fa_code(SECRET)

    # Второй этап: отправка 2FA-кода
    two_fa_response = send_2fa(TWO_FA_URL, two_fa_code)
    if two_fa_response:
        print("✅ Авторизация завершена успешно")
        print(f"Токен: {two_fa_response.get('authentication', {}).get('token')}")
    else:
        print("❌ Авторизация не удалась")

if __name__ == "__main__":
    main()
```

`pip install pyotp`
`python 2fa_test.py`

## Пример скрипта на Go для авторизации с 2FA

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "time"

    "github.com/pquerna/otp/totp"
)

// Shared secret из QR-кода
const secret = "JNJAM7A7PRSGMFRN"

// URL для логина и 2FA
const authURL = "http://localhost:9092/rest/user/login"
const twoFaURL = "http://localhost:9092/rest/user/2fa"

// Логин и пароль
const username = "test@mail.com"
const password = "password123"

// Генерация 2FA-кода с использованием pquerna/otp
func generate2FACode(secret string) string {
    twoFaCode, err := totp.GenerateCode(secret, time.Now())
    if err != nil {
        fmt.Printf("❌ Ошибка генерации 2FA-кода: %v\n", err)
        return ""
    }
    fmt.Printf("✅ Сгенерированный 2FA-код: %s\n", twoFaCode)
    return twoFaCode
}

// Выполнение первого этапа авторизации (логин)
func login(authURL, username, password string) map[string]interface{} {
    payload := map[string]string{
        "email":    username,
        "password": password,
    }
    payloadBytes, _ := json.Marshal(payload)

    resp, err := http.Post(authURL, "application/json", bytes.NewBuffer(payloadBytes))
    if err != nil {
        fmt.Printf("❌ Ошибка логина: %v\n", err)
        return nil
    }
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    if resp.StatusCode != http.StatusOK {
        fmt.Printf("❌ Ошибка логина: %d\n%s\n", resp.StatusCode, string(body))
        return nil
    }

    fmt.Println("✅ Успешный логин")
    var result map[string]interface{}
    json.Unmarshal(body, &result)
    return result
}

// Выполнение второго этапа авторизации (2FA)
func send2FA(twoFaURL, twoFaCode string) map[string]interface{} {
    payload := map[string]string{
        "code": twoFaCode,
    }
    payloadBytes, _ := json.Marshal(payload)

    resp, err := http.Post(twoFaURL, "application/json", bytes.NewBuffer(payloadBytes))
    if err != nil {
        fmt.Printf("❌ Ошибка 2FA: %v\n", err)
        return nil
    }
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    if resp.StatusCode != http.StatusOK {
        fmt.Printf("❌ Ошибка 2FA: %d\n%s\n", resp.StatusCode, string(body))
        return nil
    }

    fmt.Println("✅ Успешная 2FA")
    var result map[string]interface{}
    json.Unmarshal(body, &result)
    return result
}

func main() {
    // Первый этап: логин
    loginResponse := login(authURL, username, password)
    if loginResponse == nil {
        return
    }

    // Генерация 2FA-кода
    twoFaCode := generate2FACode(secret)
    if twoFaCode == "" {
        return
    }

    // Второй этап: отправка 2FA-кода
    twoFaResponse := send2FA(twoFaURL, twoFaCode)
    if twoFaResponse != nil {
        fmt.Println("✅ Авторизация завершена успешно")
        if token, ok := twoFaResponse["authentication"].(map[string]interface{})["token"]; ok {
            fmt.Printf("Токен: %s\n", token)
        }
    } else {
        fmt.Println("❌ Авторизация не удалась")
    }
}
```

`go get github.com/pquerna/otp`
`go run 2fa_test.go`


Что делает скрипт:
Выполняет логин с использованием логина и пароля.
Генерирует 2FA-код с использованием shared secret (FBDUQ6TRHAIWAAAV).
Отправляет 2FA-к<vscode_annotation details='%5B%7B%22title%22%3A%22hardcoded-credentials%22%2C%22description%22%3A%22Embedding%20credentials%20in%20source%20code%20risks%20unauthorized%20access%22%7D%5D'>од</vscode_annotation> на сервер.
Если всё успешно, выводит токен авторизации.
Результат:
Скрипт выполнит оба этапа авторизации и выведет токен, если авторизация прошла успешно.