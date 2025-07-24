---

## ✅ Что действительно важно от тебя на данном этапе:

| Цель                             | Нужно делать                                          | Не обязательно                                       |
| -------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| 📚 Понимание базовых угроз       | Знать OWASP Top 10 + STRIDE + MITRE ATT\&CK           | Глубокая эксплуатация уязвимостей, pentesting руками |
| 🧠 Теоретическое threat modeling | Уметь объяснить, что такое STRIDE и для чего нужно    | Не нужно строить полные DFD для каждого сервиса      |
| 🧱 Знание структуры уязвимостей  | Примерно знать, как работает XSS / CSRF / IDOR и т.д. | Не обязательно ломать Juice Shop вручную через Burp  |
| ⚙️ Понимание роли DevSecOps      | Понимать, где место безопасности в CI/CD              | Не нужно прямо сейчас строить детекторы на MITRE     |

---

## 📌 Твой **оптимальный план** (без глубокого pentest'а)

### 1. **OWASP Top 10**

* 📖 Изучи суть каждой уязвимости в OWASP Top 10 (например, через [https://owasp.org/Top10/](https://owasp.org/Top10/))
* 🔍 Понимай: как они работают, как их находят, и как защищают (например, input validation, auth checks)

### 2. **STRIDE**

* 🧱 Знай, что STRIDE = модель анализа угроз:

  * **S**poofing – подмена пользователя
  * **T**ampering – изменение данных
  * **R**epudiation – отказ от действий
  * **I**nformation Disclosure – утечка инфы
  * **D**enial of Service – отказ в обслуживании
  * **E**levation of Privilege – повышение прав

* ✏️ Умей мысленно применить STRIDE к простой системе (например, "веб-сайт с логином и корзиной").

### 3. **MITRE ATT\&CK**

* 🔍 Понимай: это база знаний об атаках, разбитых на **тактики** (что делают злоумышленники) и **техники** (как они это делают).
* Пример: тактика `Credential Access`, техника `Brute Force`.

---

## 🔖 Источники

| Тематика        | Источник                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| OWASP Top 10    | [https://owasp.org/Top10/](https://owasp.org/Top10/)                                                                 |
| STRIDE          | [Microsoft STRIDE Model](https://learn.microsoft.com/en-us/security/engineering/stride-threat-modeling)              |
| MITRE ATT\&CK   | [https://attack.mitre.org](https://attack.mitre.org/)                                                                |
| CVSS/CVE        | [https://www.first.org/cvss/](https://www.first.org/cvss/)                                                           |
| Threat modeling | [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
