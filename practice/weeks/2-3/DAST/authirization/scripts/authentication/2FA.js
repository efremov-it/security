var ScriptVars = Java.type('org.zaproxy.zap.extension.script.ScriptVars')

var TOKEN_GLOBAL_KEY = 'logintoken'
var TOKEN_TS_KEY = 'logintoken_ts'
var TOKEN_TTL_MS = 5 * 60 * 1000 // 5 минут

function authenticate(helper, paramsValues, credentials) {
	print('➡ Запускаем авторизацию с 2FA...')
	var now = new Date().getTime()
	var existingToken = ScriptVars.getGlobalVar(TOKEN_GLOBAL_KEY)
	var tokenTimestamp = ScriptVars.getGlobalVar(TOKEN_TS_KEY)

	// Проверяем, если токен ещё действителен
	if (
		existingToken &&
		tokenTimestamp &&
		now - parseInt(tokenTimestamp) < TOKEN_TTL_MS
	) {
		print('ℹ Токен ещё действителен. Повторная авторизация не требуется.')
		return null
	}

	try {
		// 1. Первый этап: логин
		var msg = helper.prepareMessage()
		if (!msg) {
			print('❌ Ошибка: объект msg равен null.')
			return null
		}
		var requestUri = paramsValues['authUrl']
		var user = credentials.getParam('username')
		var pass = credentials.getParam('password')
		var jsonBody = JSON.stringify({ email: user, password: pass })

		msg
			.getRequestHeader()
			.setURI(new org.apache.commons.httpclient.URI(requestUri, false))
		msg.getRequestHeader().setMethod('POST')
		msg.getRequestHeader().setHeader('Content-Type', 'application/json')
		msg.setRequestBody(jsonBody)
		msg.getRequestHeader().setContentLength(jsonBody.length)
		try {
			helper.sendAndReceive(msg)
		} catch (e) {
			print('❌ Ошибка: запрос завершился по таймауту. ' + e)
			return null
		}

		var responseBody = msg.getResponseBody().toString() // Преобразуем тело ответа в строку
		var responseCode = msg.getResponseHeader().getStatusCode()
		print('ℹ Ответ от сервера на логин: ' + responseCode + ', ' + responseBody)

		// Проверяем, содержит ли ответ "totp_token_required"
		if (
			responseCode !== 401 ||
			responseBody.indexOf('totp_token_required') === -1
		) {
			print('❌ Ошибка авторизации: ' + responseCode)
			return null
		}

		// Извлекаем временный токен (tmpToken)
		var loginResponse = JSON.parse(responseBody)
		var tmpToken = loginResponse.data.tmpToken
		if (!tmpToken) {
			print('❌ Не удалось получить временный токен.')
			return null
		}
		print('ℹ Полученный временный токен: ' + tmpToken)

		// 2. Генерация 2FA-кода
		var twoFaCode = get2FACode(paramsValues)

		// 3. Второй этап: отправка 2FA-кода
		var msg2 = helper.prepareMessage()
		var twoFaUri = paramsValues['twoFaUrl']
		var jsonBody2 = JSON.stringify({ totpToken: twoFaCode, tmpToken: tmpToken })

		msg2
			.getRequestHeader()
			.setURI(new org.apache.commons.httpclient.URI(twoFaUri, false))
		msg2.getRequestHeader().setMethod('POST')
		msg2.getRequestHeader().setHeader('Content-Type', 'application/json')
		msg2.setRequestBody(jsonBody2)
		msg2.getRequestHeader().setContentLength(jsonBody2.length)
		helper.sendAndReceive(msg2)

		var responseBody2 = msg2.getResponseBody().toString()
		var responseCode2 = msg2.getResponseHeader().getStatusCode()
		print('ℹ Ответ от сервера на 2FA: ' + responseCode2 + ', ' + responseBody2)

		if (responseCode2 !== 200) {
			print('❌ Ошибка 2FA: ' + responseCode2)
			return null
		}

		// 4. Извлечение токена
		var twoFaResponse = JSON.parse(responseBody2)
		var token = twoFaResponse.authentication.token
		if (!token) {
			print('❌ Не удалось извлечь токен после 2FA.')
			return null
		}
		print('✅ Токен успешно получен: ' + token)

		// Сохраняем токен в глобальные переменные
		ScriptVars.setGlobalVar(TOKEN_GLOBAL_KEY, token)
		ScriptVars.setGlobalVar(TOKEN_TS_KEY, String(now))
		return msg2
	} catch (e) {
		print('🚨 Исключение во время авторизации: ' + e)
		return null
	}
}

// Функция для получения 2FA-кода
function get2FACode(paramsValues) {
	var Crypto = Java.type('javax.crypto.Mac')
	var SecretKeySpec = Java.type('javax.crypto.spec.SecretKeySpec')
	var Base64 = Java.type('java.util.Base64')
	var ByteBuffer = Java.type('java.nio.ByteBuffer')
	var Instant = Java.type('java.time.Instant')

	// Shared secret (должен быть в Base32)
	var secret = paramsValues['sharedSecret']

	// Декодируем секрет из Base32
	var base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
	var secretBytes = []
	var bits = 0
	var value = 0
	for (var i = 0; i < secret.length; i++) {
		var charIndex = base32Chars.indexOf(secret.charAt(i).toUpperCase())
		if (charIndex === -1) {
			throw new Error('Invalid Base32 character: ' + secret.charAt(i))
		}
		value = (value << 5) | charIndex
		bits += 5
		if (bits >= 8) {
			secretBytes.push((value >>> (bits - 8)) & 0xff)
			bits -= 8
		}
	}

	// Генерируем TOTP-код
	var timeStep = 30 // Шаг времени в секундах
	var time = Math.floor(Instant.now().getEpochSecond() / timeStep)
	var timeBytes = ByteBuffer.allocate(8).putLong(time).array()

	var mac = Crypto.getInstance('HmacSHA1')
	mac.init(new SecretKeySpec(secretBytes, 'HmacSHA1'))
	var hash = mac.doFinal(timeBytes)

	var offset = hash[hash.length - 1] & 0xf
	var binary =
		((hash[offset] & 0x7f) << 24) |
		((hash[offset + 1] & 0xff) << 16) |
		((hash[offset + 2] & 0xff) << 8) |
		(hash[offset + 3] & 0xff)

	var otp = binary % 1000000
	var otpString = otp.toString()
	while (otpString.length < 6) {
		otpString = '0' + otpString
	}
	return otpString
}

function getRequiredParamsNames() {
	return ['authUrl', 'twoFaUrl']
}

function getOptionalParamsNames() {
	return []
}

function getCredentialsParamsNames() {
	return ['username', 'password']
}
