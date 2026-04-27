const itemsService = require("../services/itemsService");

async function createItem(request, response, next) {
  try {
    const item = itemsService.createItem(request.body);
    response.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

async function listItems(request, response, next) {
  try {
    const result = itemsService.listItems(request.query);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

async function updateItem(request, response, next) {
  try {
    const item = itemsService.updateItem(request.params.id, request.body);
    response.json(item);
  } catch (error) {
    next(error);
  }
}

async function listAlerts(request, response, next) {
  try {
    const result = itemsService.listAlerts(request.query);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createItem,
  listItems,
  updateItem,
  listAlerts
};
