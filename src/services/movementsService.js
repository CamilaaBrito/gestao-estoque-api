const { randomUUID } = require("crypto");

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
const { isValidDdMmYyyy } = require("../utils/dateUtils");
const { buildPageResponse, paginate } = require("../utils/pagination");
const { createAppError } = require("../utils/errors");

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
    throw createAppError(400, "INVALID_PAYLOAD", "Corpo da requisicao invalido.");
  }

  if (typeof payload.item_id !== "string" || !payload.item_id.trim()) {
    throw createAppError(400, "INVALID_ITEM_ID", "item_id e obrigatorio.");
  }

  if (!MOVEMENT_TYPES.has(payload.type)) {
    throw createAppError(400, "INVALID_MOVEMENT_TYPE", "type deve ser INPUT ou USAGE.");
  }

  parseDecimal(payload.quantity, "quantity", 3);

  if (payload.type === "INPUT" && (payload.unit_price === undefined || payload.unit_price === null || payload.unit_price === "")) {
    throw createAppError(
      400,
      "UNIT_PRICE_REQUIRED",
      "unit_price e obrigatorio para movimentacoes do tipo INPUT."
    );
  }

  if (payload.unit_price !== undefined && payload.unit_price !== null) {
    parseDecimal(payload.unit_price, "unit_price", 4);
  }

  if (payload.expiry_date !== undefined && payload.expiry_date !== null && !isValidDdMmYyyy(payload.expiry_date)) {
    throw createAppError(400, "INVALID_DATE", "expiry_date deve estar no formato DD-MM-YYYY.");
  }

  if (payload.reason !== undefined && payload.reason !== null && typeof payload.reason !== "string") {
    throw createAppError(400, "INVALID_REASON", "reason deve ser texto.");
  }
}

function createMovement(payload) {
  validateMovementPayload(payload);

  const item = itemModel.findById(payload.item_id);

  if (!item) {
    throw createAppError(404, "ITEM_NOT_FOUND", "Item nao encontrado.");
  }

  const quantity = toQuantityNumber(payload.quantity);
  let updatedBalance = item.total_quantity;

  if (payload.type === "USAGE") {
    if (quantity > item.total_quantity) {
      throw createAppError(
        400,
        "INSUFFICIENT_BALANCE",
        "Quantidade solicitada excede o saldo disponivel.",
        {
          available_quantity: formatQuantity(item.total_quantity),
          requested_quantity: formatQuantity(quantity)
        }
      );
    }

    updatedBalance = item.total_quantity - quantity;
  } else {
    updatedBalance = item.total_quantity + quantity;
  }

  const movement = {
    id: randomUUID(),
    item_id: payload.item_id,
    type: payload.type,
    quantity,
    unit_price: payload.unit_price === undefined || payload.unit_price === null ? null : applyMoneyRounding(toMoneyNumber(payload.unit_price)),
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
  const item = itemModel.findById(itemId);

  if (!item) {
    throw createAppError(404, "ITEM_NOT_FOUND", "Item nao encontrado.");
  }

  const page = parseInteger(query.page ?? 1, "page", { min: 1 });
  const pageSize = parseInteger(query.page_size ?? 20, "page_size", { min: 1, max: 100 });

  const sortedMovements = movementModel
    .listByItemId(itemId)
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
