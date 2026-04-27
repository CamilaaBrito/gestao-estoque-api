const { createAppError } = require("./errors");

function parseDecimal(value, fieldName, maxDecimals) {
  const normalized = typeof value === "number" ? value.toString() : String(value ?? "").trim();
  const regex = new RegExp(`^\\d+(\\.\\d{1,${maxDecimals}})?$`);

  if (!regex.test(normalized)) {
    throw createAppError(400, "INVALID_DECIMAL", `${fieldName} deve ser um decimal valido com ate ${maxDecimals} casas.`);
  }

  return normalized;
}

function toQuantityNumber(value) {
  return Number(parseDecimal(value, "quantity", 3));
}

function toMoneyNumber(value) {
  return Number(parseDecimal(value, "unit_price", 4));
}

function parseInteger(value, fieldName, options = {}) {
  const integerValue = Number(value);

  if (!Number.isInteger(integerValue)) {
    throw createAppError(400, "INVALID_INTEGER", `${fieldName} deve ser um numero inteiro.`);
  }

  if (options.min !== undefined && integerValue < options.min) {
    throw createAppError(400, "INVALID_INTEGER", `${fieldName} deve ser maior ou igual a ${options.min}.`);
  }

  if (options.max !== undefined && integerValue > options.max) {
    throw createAppError(400, "INVALID_INTEGER", `${fieldName} deve ser menor ou igual a ${options.max}.`);
  }

  return integerValue;
}

function applyMoneyRounding(value) {
  return Math.round(value * 10000) / 10000;
}

function formatQuantity(value) {
  return Number(value).toFixed(3);
}

function formatMoney(value) {
  return Number(value).toFixed(4);
}

module.exports = {
  parseDecimal,
  toQuantityNumber,
  toMoneyNumber,
  parseInteger,
  applyMoneyRounding,
  formatQuantity,
  formatMoney
};
