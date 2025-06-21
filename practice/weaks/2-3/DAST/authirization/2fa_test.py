import requests
import pyotp

# Shared secret из QR-кода
SECRET = "LVNT2ARXHR3XUFLS"

# URL для логина и 2FA
AUTH_URL = "http://localhost:3000/rest/user/login"
TWO_FA_URL = "http://localhost:3000/rest/2fa/verify"

# Логин и пароль
USERNAME = "test@mail.com"
PASSWORD = "password01"

# Генерация 2FA-кода с использованием pyotp
def generate_2fa_code(secret):
    totp = pyotp.TOTP(secret)
    two_fa_code = totp.now()
    print(f"✅ Сгенерированный 2FA-код: {two_fa_code}")
    return two_fa_code

# Выполнение первого этапа авторизации (логин)
def login(auth_url, username, password):
    payload = {"email": username, "password": password}
    print(f"ℹ️  Отправляем запрос на логин с payload: {payload}")
    response = requests.post(auth_url, json=payload)
    print(f"ℹ️  Ответ от сервера на логин: {response.status_code}, {response.text}")
    if response.status_code == 200:
        print("✅ Успешный логин")
        return response.json()
    elif response.status_code == 401 and "totp_token_required" in response.text:
        print("ℹ️  Требуется 2FA-код")
        return response.json()  # Возвращаем ответ с tmpToken
    else:
        print(f"❌ Ошибка логина: {response.status_code}")
        print(response.text)
        return None

# Выполнение второго этапа авторизации (2FA)
def send_2fa(two_fa_url, two_fa_code, tmp_token):
    payload = {"totpToken": two_fa_code, "tmpToken": tmp_token}
    print(f"ℹ️  Отправляем запрос на 2FA с payload: {payload}")
    response = requests.post(two_fa_url, json=payload)
    print(f"ℹ️  Ответ от сервера на 2FA: {response.status_code}, {response.text}")
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

    # Извлечение временного токена
    tmp_token = login_response.get("data", {}).get("tmpToken")
    if not tmp_token:
        print("❌ Не удалось получить временный токен")
        return
    print(f"ℹ️  Полученный временный токен: {tmp_token}")

    # Генерация 2FA-кода
    two_fa_code = generate_2fa_code(SECRET)

    # Второй этап: отправка 2FA-кода
    two_fa_response = send_2fa(TWO_FA_URL, two_fa_code, tmp_token)
    if two_fa_response:
        print("✅ Авторизация завершена успешно")
        print(f"Токен: {two_fa_response.get('authentication', {}).get('token')}")
    else:
        print("❌ Авторизация не удалась")

if __name__ == "__main__":
    main()
