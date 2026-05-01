const db = require("./db");

function create(movement) {
  db.movements.push(movement);
  return movement;
}

function listByItemId(itemId) {
  return db.movements.filter((movement) => movement.item_id === itemId);
}

module.exports = {
  create,
  listByItemId
};