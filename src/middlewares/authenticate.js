const authService = require("../services/authService");
const { createAppError } = require("../utils/errors");

function authenticate(request, _response, next) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return next(createAppError(401, "MISSING_TOKEN", "Informe um token Bearer no cabecalho Authorization."));
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(createAppError(401, "INVALID_TOKEN", "O cabecalho Authorization deve usar o formato Bearer <token>."));
  }

  request.user = authService.verifyToken(token);
  return next();
}

module.exports = authenticate;
