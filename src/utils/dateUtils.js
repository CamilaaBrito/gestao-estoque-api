/**
 * Valida apenas o formato DD-MM-YYYY sem verificar se a data realmente existe
 * @param {string} value - Data no formato DD-MM-YYYY
 * @returns {boolean} true se o formato é válido
 */
function isValidDateFormatDdMmYyyy(value) {
  if (typeof value !== "string") {
    return false;
  }

  const match = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/.exec(value);
  return match !== null;
}

function isValidDdMmYyyy(value) {
  if (typeof value !== "string") {
    return false;
  }

  const match = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, day, month, year] = match;
  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return (
    utcDate.getUTCFullYear() === Number(year) &&
    utcDate.getUTCMonth() === Number(month) - 1 &&
    utcDate.getUTCDate() === Number(day)
  );
}

function toUtcDate(value) {
  const [day, month, year] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function compareDdMmYyyy(left, right) {
  return toUtcDate(left) - toUtcDate(right);
}

function isWithinLeadTime(value, leadTimeDays) {
  const targetDate = toUtcDate(value);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= leadTimeDays;
}

/**
 * Verifica se uma data de validade é passada (anterior a hoje)
 * @param {string} value - Data no formato DD-MM-YYYY
 * @returns {boolean} true se a data é passada, false se é futura ou igual a hoje
 */
function isExpiryDateInThePast(value) {
  const targetDate = toUtcDate(value);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return targetDate < today;
}

module.exports = {
  isValidDateFormatDdMmYyyy,
  isValidDdMmYyyy,
  compareDdMmYyyy,
  isWithinLeadTime,
  isExpiryDateInThePast
};
