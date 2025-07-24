var ScriptVars = Java.type('org.zaproxy.zap.extension.script.ScriptVars')

function extractWebSession(sessionWrapper) {
	// Получаем токен из глобальной переменной, установленной основным скриптом
	var token = ScriptVars.getGlobalVar('logintoken')
	if (token) {
		sessionWrapper.getSession().setValue('token', token)
	}
}

function clearWebSessionIdentifiers(sessionWrapper) {
	var headers = sessionWrapper.getHttpMessage().getRequestHeader()
	headers.setHeader('Authorization', null)
	sessionWrapper.getSession().setValue('token', null)
}

function processMessageToMatchSession(sessionWrapper) {
	var token = sessionWrapper.getSession().getValue('token')
	if (!token) {
		print('Session management script: no token')
		return
	}
	var msg = sessionWrapper.getHttpMessage()
	msg.getRequestHeader().setHeader('Authorization', 'Bearer ' + token)
	print('Session script: добавлен токен в запрос: ' + token)
}

function getRequiredParamsNames() {
	return []
}

function getOptionalParamsNames() {
	return []
}
