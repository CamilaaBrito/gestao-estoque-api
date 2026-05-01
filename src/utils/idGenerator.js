const db = require("../models/db");

/**
 * Gera um ID incremental para itens
 * @returns {number} Próximo ID incremental para item
 */
function generateItemId() {
  const id = db.nextItemId;
  db.nextItemId += 1;
  return id;
}

/**
 * Gera um ID incremental para movimentações
 * @returns {number} Próximo ID incremental para movimento
 */
function generateMovementId() {
  const id = db.nextMovementId;
  db.nextMovementId += 1;
  return id;
}

module.exports = {
  generateItemId,
  generateMovementId
};
