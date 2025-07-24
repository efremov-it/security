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
const twoFaURL = "http://localhost:9092/rest/2fa/verify"

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
