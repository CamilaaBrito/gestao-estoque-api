const { createAppError } = require("./errors");

function parseDecimal(value, fieldName, maxDecimals) {
  const normalized = typeof value === "number" ? value.toString() : String(value ?? "").trim();
  const regex = new RegExp(`^\\d+(\\.\\d{1,${maxDecimals}})?$`);

  if (!regex.test(normalized)) {
    throw createAppError(400, "INVALID_DECIMAL", `${fieldName} deve ser um decimal válido com ate ${maxDecimals} casas.`);
  }

  return normalized;
}

function toQuantityNumber(value) {
  return Number(parseDecimal(value, "quantity", 2));
}

function toMoneyNumber(value) {
  return Number(parseDecimal(value, "unit_price", 4));
}

function parseInteger(value, fieldName, options = {}) {
  const integerValue = Number(value);

  if (!Number.isInteger(integerValue)) {
    throw createAppError(400, "INVALID_INTEGER", `${fieldName} deve ser um número inteiro.`);
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
  const numericValue = Number(value);

  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }

  return numericValue.toFixed(2).replace(".", ",");
}

function formatMoney(value) {
    const numericValue = Number(value);

      if (Number.isInteger(numericValue)) {
        return String(numericValue);
      }

  return numericValue.toFixed(2).replace(".", ",");
  
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


