var ScriptVars = Java.type('org.zaproxy.zap.extension.script.ScriptVars')

function extractWebSession(sessionWrapper) {
	var token = ScriptVars.getGlobalVar('logintoken')
	if (!token) {
		print('❌ Токен отсутствует в глобальных переменных.')
		return
	}
	sessionWrapper.getSession().setValue('token', token)
	print('✅ Токен успешно извлечён из глобальных переменных: ' + token)
}

function clearWebSessionIdentifiers(sessionWrapper) {
	try {
		var headers = sessionWrapper.getHttpMessage().getRequestHeader()
		headers.setHeader('Authorization', null)
		sessionWrapper.getSession().setValue('token', null)
		print('ℹ️ Заголовок Authorization очищен.')
	} catch (e) {
		print('❌ Ошибка при очистке идентификаторов сессии: ' + e)
	}
}

function processMessageToMatchSession(sessionWrapper) {
	var token = sessionWrapper.getSession().getValue('token')
	if (!token || token.length < 10) {
		print('❌ Некорректный токен: ' + token)
		return
	}
	var msg = sessionWrapper.getHttpMessage()
	msg.getRequestHeader().setHeader('Authorization', 'Bearer ' + token)
	print('✅ Токен добавлен в запрос: Bearer ' + token)
}

function getRequiredParamsNames() {
	return []
}

function getOptionalParamsNames() {
	return []
}
