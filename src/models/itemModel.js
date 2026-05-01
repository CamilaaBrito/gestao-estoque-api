const db = require("./db");

function create(item) {
  db.items.push(item);
  return item;
}

function findById(id) {
  return db.items.find((item) => item.id === id) || null;
}

function update(id, changes) {
  const item = findById(id);

  if (!item) {
    return null;
  }

  Object.assign(item, changes);
  return item;
}

function list() {
  return db.items;
}

module.exports = {
  create,
  findById,
  update,
  list,
};