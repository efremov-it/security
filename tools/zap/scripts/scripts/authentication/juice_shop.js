function authenticate(helper, paramsValues, credentials) {
    print("➡ Выполняем авторизацию через API...");

    var msg = helper.prepareMessage();
    var requestUri = paramsValues["authUrl"];  // ← из настроек
    var user = credentials.getParam("username");
    var pass = credentials.getParam("password");

    var body = "email=" + encodeURIComponent(user) + "&password=" + encodeURIComponent(pass);

    msg.getRequestHeader().setURI(new org.apache.commons.httpclient.URI(requestUri, false));
    msg.getRequestHeader().setMethod("POST");
    msg.getRequestHeader().setHeader("Content-Type", "application/x-www-form-urlencoded");
    msg.setRequestBody(body);
    msg.getRequestHeader().setContentLength(msg.getRequestBody().length());

    helper.sendAndReceive(msg);

    var token = JSON.parse(msg.getResponseBody().toString()).authentication.token;
    print("✅ Токен получен: " + token);

    // Сохраняем токен в глобальную переменную — чтобы потом использовать его в Header Injection (или где угодно)
    org.zaproxy.zap.extension.script.ScriptVars.setGlobalVar("logintoken", token);

    return msg;
}

function getRequiredParamsNames(){
    return ["authUrl"];
}

function getOptionalParamsNames(){
    return [];
}

function getCredentialsParamsNames(){
    return ["username", "password"];
}
