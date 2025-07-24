var TOKEN_GLOBAL_KEY = 'logintoken'
var TOKEN_TS_KEY = 'logintoken_ts'
var TOKEN_TTL_MS = 5 * 60 * 1000 // 5 минут

function authenticate(helper, paramsValues, credentials) {
	print('➡ Запускаем авторизацию через API...')

	var debugEnabled = paramsValues['debug'] === 'true'
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

		var dummyMsg = helper.prepareMessage()
		var uri = new org.apache.commons.httpclient.URI(
			paramsValues['authUrl'],
			false
		)
		dummyMsg.setRequestHeader(
			new org.parosproxy.paros.network.HttpRequestHeader(
				'GET ' + uri.getPath() + ' HTTP/1.1\r\nHost: ' + uri.getHost()
			)
		)
		dummyMsg.getRequestHeader().setURI(uri)
		dummyMsg
			.getRequestHeader()
			.setHeader('Authorization', 'Bearer ' + existingToken)
		dummyMsg.setRequestBody('')
		dummyMsg.getRequestHeader().setContentLength(0)

		return dummyMsg
	}

	try {
		var msg = helper.prepareMessage()
		var requestUri = paramsValues['authUrl']
		var user = credentials.getParam('username')
		var pass = credentials.getParam('password')

		var template = paramsValues['loginRequestBody']
		if (!template) {
			print(
				'⚠️ loginRequestBody не указан, используем по умолчанию: email/пароль'
			)
			template = '{"email":"{%username%}","password":"{%password%}"}'
		}
		var jsonBody = template
			.replace('{%username%}', user)
			.replace('{%password%}', pass)

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

		log('INFO', 'ℹ Ответ авторизации: ' + responseCode, false, debugEnabled)
		log('DEBUG', '📦 Тело ответа: ' + responseBody, true, debugEnabled)

		if (responseCode !== 200) {
			print('❌ Ошибка авторизации: ' + responseCode)
			return null
		}

		var json = JSON.parse(responseBody)
		var tokenPath = paramsValues['tokenPath'] || 'authentication.token'
		var token = resolveJsonPath(json, tokenPath)

		if (!token) {
			print('❌ Не удалось извлечь токен из ответа по пути: ' + tokenPath)
			return null
		}

		if (debugEnabled) {
			print('✅  ' + token)
		} else {
			print('✅ Токен успешно получен (скрыт, включите debug для вывода)')
		}
		
		log('INFO', 'Токен успешно получен', false, debugEnabled)
		log('DEBUG', 'Токен: ' + token, true, debugEnabled)


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

function resolveJsonPath(obj, path) {
	return path.split('.').reduce(function (prev, curr) {
		return prev && prev[curr]
	}, obj)
}

function log(level, message, sensitive, debugEnabled) {
	level = level.toUpperCase()

	// Пропуск DEBUG и SENSITIVE, если debug отключен
	if (!debugEnabled && (level === 'DEBUG' || sensitive)) {
		return
	}

	var prefix =
		{
			DEBUG: '🐞 [DEBUG]',
			INFO: 'ℹ️ [INFO]',
			WARN: '⚠️ [WARN]',
			ERROR: '❌ [ERROR]',
		}[level] || '[LOG]'

	print(prefix + ' ' + message)
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
