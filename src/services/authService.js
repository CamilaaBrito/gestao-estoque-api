const jwt = require("jsonwebtoken");

const { createAppError } = require("../utils/errors");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "gestao-estoque-api-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function login(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createAppError(400, "INVALID_PAYLOAD", "Corpo da requisicao invalido.");
  }

  const { username, password } = payload;

  if (typeof username !== "string" || typeof password !== "string") {
    throw createAppError(400, "INVALID_CREDENTIALS", "username e password sao obrigatorios.");
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    throw createAppError(401, "INVALID_CREDENTIALS", "Credenciais invalidas.");
  }

  const token = jwt.sign(
    {
      sub: ADMIN_USERNAME,
      role: "admin"
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );

  return {
    token_type: "Bearer",
    access_token: token,
    expires_in: JWT_EXPIRES_IN
  };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_error) {
    throw createAppError(401, "INVALID_TOKEN", "Token JWT invalido ou expirado.");
  }
}

module.exports = {
  login,
  verifyToken
};
