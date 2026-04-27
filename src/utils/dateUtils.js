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

module.exports = {
  isValidDdMmYyyy,
  compareDdMmYyyy,
  isWithinLeadTime
};
