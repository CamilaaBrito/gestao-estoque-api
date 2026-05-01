const itemModel = require("../models/itemModel");
const movementModel = require("../models/movementModel");
const itemsService = require("./itemsService");
const {
  applyMoneyRounding,
  formatMoney,
  formatQuantity,
  parseDecimal,
  toMoneyNumber,
  toQuantityNumber,
  parseInteger
} = require("../utils/numberUtils");
const { isValidDateFormatDdMmYyyy, isValidDdMmYyyy, isExpiryDateInThePast } = require("../utils/dateUtils");
const { buildPageResponse, paginate } = require("../utils/pagination");
const { createAppError } = require("../utils/errors");
const { generateMovementId } = require("../utils/idGenerator");

const MOVEMENT_TYPES = new Set(["INPUT", "USAGE"]);

function serializeMovement(movement) {
  return {
    id: movement.id,
    item_id: movement.item_id,
    type: movement.type,
    quantity: formatQuantity(movement.quantity),
    unit_price: movement.unit_price === null ? null : formatMoney(movement.unit_price),
    balance_after: formatQuantity(movement.balance_after),
    expiry_date: movement.expiry_date,
    reason: movement.reason,
    created_at: movement.created_at
  };
}

function validateMovementPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createAppError(400, "INVALID_PAYLOAD", "Corpo da requisição inválido.");
  }

  parseInteger(payload.item_id, "item_id", { min: 1 });

  if (!MOVEMENT_TYPES.has(payload.type)) {
    throw createAppError(400, "INVALID_MOVEMENT_TYPE", "type deve ser INPUT ou USAGE.");
  }

  parseDecimal(payload.quantity, "quantity", 2);

  if (payload.type === "INPUT") {
    if (
      payload.unit_price === undefined ||
      payload.unit_price === null ||
      payload.unit_price === ""
    ) {
      throw createAppError(
        400,
        "UNIT_PRICE_REQUIRED",
        "unit_price é obrigatório para INPUT (pode ser 0)."
      );
    }

    parseDecimal(payload.unit_price, "unit_price", 2);
  }

  if (payload.type === "USAGE" && payload.unit_price !== undefined) {
    throw createAppError(
      400,
      "UNIT_PRICE_NOT_ALLOWED",
      "unit_price não deve ser enviado para USAGE."
    );
  }

  if (payload.expiry_date !== undefined && payload.expiry_date !== null && !isValidDateFormatDdMmYyyy(payload.expiry_date)) {
    throw createAppError(400, "INVALID_DATE_FORMAT", "Data de validade deve estar no formato DD-MM-YYYY.");
  }

  if (payload.expiry_date !== undefined && payload.expiry_date !== null && !isValidDdMmYyyy(payload.expiry_date)) {
    throw createAppError(400, "INVALID_DATE", "Data de validade deve estar no formato DD-MM-YYYY.");
  }

  if (payload.expiry_date !== undefined && payload.expiry_date !== null && isExpiryDateInThePast(payload.expiry_date)) {
    throw createAppError(400, "EXPIRY_DATE_IN_THE_PAST", "Data de validade não pode ser uma data passada.");
  }

  if (payload.reason !== undefined && payload.reason !== null && typeof payload.reason !== "string") {
    throw createAppError(400, "INVALID_REASON", "reason deve ser texto.");
  }
}

function createMovement(payload) {
  validateMovementPayload(payload);

  const itemId = parseInteger(payload.item_id, "item_id", { min: 1 });

  const item = itemModel.findById(itemId);

  if (!item) {
    throw createAppError(404, "ITEM_NOT_FOUND", "Item não encontrado.");
  }

  const quantity = toQuantityNumber(payload.quantity);

  if (quantity <= 0) {
    throw createAppError(400, "INVALID_QUANTITY", "quantity deve ser maior que zero.");
  }

  let unitPrice = null;

  if (payload.type === "INPUT") {
    unitPrice = applyMoneyRounding(toMoneyNumber(payload.unit_price));
  }

  let updatedBalance = item.total_quantity;

  if (payload.type === "USAGE") {
    if (quantity > item.total_quantity) {
      throw createAppError(400, "INSUFFICIENT_BALANCE", "Quantidade excede o saldo disponível.");
    }

    updatedBalance = item.total_quantity - quantity;
  } else {
    updatedBalance = item.total_quantity + quantity;
  }

  const movement = {
    id: generateMovementId(),
    item_id: itemId,
    type: payload.type,
    quantity,
    batch_id: payload.batch_id ?? null,
    unit_price: unitPrice,
    balance_after: updatedBalance,
    expiry_date: payload.expiry_date ?? null,
    reason: payload.reason ?? null,
    created_at: new Date().toISOString()
  };

  movementModel.create(movement);

  itemModel.update(item.id, {
    total_quantity: updatedBalance,
    updated_at: new Date().toISOString()
  });

  if (payload.type === "INPUT" && payload.expiry_date) {
    itemsService.refreshNearestExpiry(item.id);
  }

  return serializeMovement(movement);
}


function listItemMovements(itemId, query) {

  const parsedItemId = parseInteger(itemId, "item_id", { min: 1 });

  const item = itemModel.findById(parsedItemId);

  if (!item) {
    throw createAppError(404, "ITEM_NOT_FOUND", "Item não encontrado.");
  }


  const page = parseInteger(query.page ?? 1, "page", { min: 1 });
  const pageSize = parseInteger(query.page_size ?? 20, "page_size", { min: 1, max: 100 });

  const sortedMovements = movementModel
    .listByItemId(parsedItemId)
    .slice()
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));

  return buildPageResponse(paginate(sortedMovements, page, pageSize), serializeMovement);
}

function createMethodNotAllowedError(message) {
  return createAppError(405, "METHOD_NOT_ALLOWED", message);
}

module.exports = {
  createMovement,
  listItemMovements,
  createMethodNotAllowedError
};
