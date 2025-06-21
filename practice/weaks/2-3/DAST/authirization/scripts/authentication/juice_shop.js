var TOKEN_GLOBAL_KEY = 'logintoken'
var TOKEN_TS_KEY = 'logintoken_ts'
var TOKEN_TTL_MS = 5 * 60 * 1000 // 5 минут

function authenticate(helper, paramsValues, credentials) {
	print('➡ Запускаем авторизацию через API...')

	var now = new Date().getTime()
	var existingToken =
		org.zaproxy.zap.extension.script.ScriptVars.getGlobalVar(TOKEN_GLOBAL_KEY)
	var tokenTimestamp =
		org.zaproxy.zap.extension.script.ScriptVars.getGlobalVar(TOKEN_TS_KEY)

	if (
		existingToken &&
		tokenTimestamp &&
		now - parseInt(tokenTimestamp) < TOKEN_TTL_MS
	) {
		print(
			'ℹ Токен уже существует и ещё действителен. Повторная авторизация не требуется.'
		)
		return null
	}

	try {
		var msg = helper.prepareMessage()
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

		helper.sendAndReceive(msg)

		var responseBody = msg.getResponseBody().toString()
		var responseCode = msg.getResponseHeader().getStatusCode()

		print('ℹ Ответ авторизации: ' + responseCode)
		print('📦 Тело ответа: ' + responseBody)

		if (responseCode !== 200) {
			print('❌ Ошибка авторизации: ' + responseCode)
			return null
		}

		var json = JSON.parse(responseBody)
		var token = json?.authentication?.token

		if (!token) {
			print('❌ Не удалось извлечь токен из ответа.')
			return null
		}

		print('✅ Токен успешно получен: ' + token)

		org.zaproxy.zap.extension.script.ScriptVars.setGlobalVar(
			TOKEN_GLOBAL_KEY,
			token
		)
		org.zaproxy.zap.extension.script.ScriptVars.setGlobalVar(
			TOKEN_TS_KEY,
			String(now)
		)

		return msg
	} catch (e) {
		print('🚨 Исключение во время авторизации: ' + e)
		return null
	}
}

function getRequiredParamsNames() {
	return ['authUrl']
}

function getOptionalParamsNames() {
	return []
}

function getCredentialsParamsNames() {
	return ['username', 'password']
}
