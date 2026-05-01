const itemModel = require("../models/itemModel");
const movementModel = require("../models/movementModel");
const {
  parseDecimal,
  formatQuantity,
  toQuantityNumber,
  parseInteger,
  formatMoney,
  toMoneyNumber
} = require("../utils/numberUtils");
const {
  isValidDateFormatDdMmYyyy,
  isValidDdMmYyyy,
  compareDdMmYyyy,
  isWithinLeadTime,
  isExpiryDateInThePast
} = require("../utils/dateUtils");
const { buildPageResponse, paginate } = require("../utils/pagination");
const { createAppError } = require("../utils/errors");
const { generateItemId } = require("../utils/idGenerator");

const VALID_UNITS = new Set(["UN", "KG", "L", "CX", "PCT"]);

function normalizeMinEstoque(payload) {
  return payload.min_estoque ?? payload.min_stock;
}


function validateItemPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createAppError(400, "INVALID_PAYLOAD", "Corpo da requisicao invalido.");
  }

  if (partial && Object.keys(payload).length === 0) {
    throw createAppError(400, "INVALID_PAYLOAD", "Informe ao menos um campo para atualizacao.");
  }

  if (!partial || payload.name !== undefined) {
    if (typeof payload.name !== "string" || !payload.name.trim()) {
      throw createAppError(400, "INVALID_NAME", "name e obrigatorio.");
    }
  }

  if (!partial || payload.unit !== undefined) {
    if (!VALID_UNITS.has(payload.unit)) {
      throw createAppError(400, "INVALID_UNIT", "unit deve ser um dos valores permitidos.");
    }
  }

  const minEstoque = normalizeMinEstoque(payload);

  if (!partial || payload.total_quantity !== undefined) {
    parseDecimal(payload.total_quantity, "total_quantity", 2);
  }

  if (!partial || minEstoque !== undefined) {
    parseDecimal(minEstoque, "min_estoque", 3);
  }

  if (!partial || payload.expiry_lead_time !== undefined) {
    parseInteger(payload.expiry_lead_time, "expiry_lead_time");
  }

  if (
    payload.nearest_expiry !== undefined &&
    payload.nearest_expiry !== null &&
    !isValidDateFormatDdMmYyyy(payload.nearest_expiry)
  ) {
    throw createAppError(400, "INVALID_DATE_FORMAT", "nearest_expiry deve estar no formato DD-MM-YYYY.");
  }

  if (
    payload.nearest_expiry !== undefined &&
    payload.nearest_expiry !== null &&
    !isValidDdMmYyyy(payload.nearest_expiry)
  ) {
    throw createAppError(400, "INVALID_DATE", "Esta data não é válida.");
  }

  if (
    payload.nearest_expiry !== undefined &&
    payload.nearest_expiry !== null &&
    isExpiryDateInThePast(payload.nearest_expiry)
  ) {
    throw createAppError(400, "EXPIRY_DATE_IN_THE_PAST", "nearest_expiry não pode ser uma data passada.");
  }

  if (payload.is_active !== undefined && typeof payload.is_active !== "boolean") {
    throw createAppError(400, "INVALID_STATUS", "is_active deve ser boolean.");
  }

  // 🔥 NOVO: validação de unit_price
  if (!partial || payload.unit_price !== undefined) {
    if (
      payload.unit_price === undefined ||
      payload.unit_price === null ||
      payload.unit_price === ""
    ) {
      throw createAppError(
        400,
        "UNIT_PRICE_REQUIRED",
        "unit_price é obrigatório para o item."
      );
    }

    parseDecimal(payload.unit_price, "unit_price", 2);
  }
}


function serializeItem(item) {
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    total_quantity: formatQuantity(item.total_quantity),
    unit_price: item.unit_price === null ? null : formatMoney(item.unit_price), // 🔥 NOVO
    min_estoque: formatQuantity(item.min_estoque),
    nearest_expiry: item.nearest_expiry,
    expiry_lead_time: item.expiry_lead_time,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}


function createItem(payload) {
  validateItemPayload(payload);

  function normalizeString(value) {
    return value
      .normalize("NFD")                 
      .replace(/[\u0300-\u036f]/g, "") 
      .toLowerCase()
      .trim();
  }
  const normalizedName = normalizeString(payload.name);

  const existingItem = itemModel
    .list()
    .find(item => normalizeString(item.name) === normalizedName);

  if (existingItem) {
    throw createAppError(
      409,
      "ITEM_ALREADY_EXISTS",
      "Já existe um item com esse nome."
    );
  }

  const now = new Date().toISOString();

  const item = {
    id: generateItemId(),
    name: payload.name.trim(),
    unit: payload.unit,
    total_quantity: toQuantityNumber(payload.total_quantity),
    unit_price: toMoneyNumber(payload.unit_price), // NOVO
    min_estoque: toQuantityNumber(normalizeMinEstoque(payload)),
    nearest_expiry: payload.nearest_expiry ?? null,
    expiry_lead_time: parseInteger(payload.expiry_lead_time, "expiry_lead_time"),
    is_active: payload.is_active ?? true,
    created_at: now,
    updated_at: now
  };

  itemModel.create(item);

  return serializeItem(item);
}


function listItems(query) {
  const page = parseInteger(query.page ?? 1, "page", { min: 1 });
  const pageSize = parseInteger(query.page_size ?? 20, "page_size", { min: 1, max: 100 });
  const name = typeof query.name === "string" ? query.name.trim().toLowerCase() : "";
  const isActive = query.is_active;

  let items = itemModel.list();

  if (name) {
    items = items.filter((item) => item.name.toLowerCase().includes(name));
  }

  if (isActive !== undefined) {
    const normalized = String(isActive).toLowerCase();

    if (!["true", "false"].includes(normalized)) {
      throw createAppError(400, "INVALID_STATUS_FILTER", "is_active deve ser true ou false.");
    }

    items = items.filter((item) => item.is_active === (normalized === "true"));
  }

  items = [...items].sort((left, right) => left.name.localeCompare(right.name));

  return buildPageResponse(paginate(items, page, pageSize), serializeItem);
}


function updateItem(id, payload) {
  validateItemPayload(payload, { partial: true });

  const parsedId = parseInteger(id, "item_id", { min: 1 });

  const item = itemModel.findById(parsedId);

  if (!item) {
    throw createAppError(404, "ITEM_NOT_FOUND", "Item nao encontrado.");
  }

  const changes = {};

  if (payload.name !== undefined) {
    changes.name = payload.name.trim();
  }

  if (payload.unit !== undefined) {
    changes.unit = payload.unit;
  }

  if (normalizeMinEstoque(payload) !== undefined) {
    changes.min_estoque = toQuantityNumber(normalizeMinEstoque(payload));
  }

  if (payload.nearest_expiry !== undefined) {
    changes.nearest_expiry = payload.nearest_expiry;
  }

  if (payload.expiry_lead_time !== undefined) {
    changes.expiry_lead_time = parseInteger(payload.expiry_lead_time, "expiry_lead_time");
  }

  if (payload.is_active !== undefined) {
    changes.is_active = payload.is_active;
  }

  
  if (payload.unit_price !== undefined) {
    if (
      payload.unit_price === null ||
      payload.unit_price === ""
    ) {
      throw createAppError(
        400,
        "UNIT_PRICE_REQUIRED",
        "valor não pode ser nulo."
      );
    }

    changes.unit_price = toMoneyNumber(payload.unit_price);
  }

  changes.updated_at = new Date().toISOString();

  itemModel.update(parsedId, changes);

  return serializeItem(item);
}

function buildAlertsForItem(item) {
  const alerts = [];

  if (item.total_quantity <= item.min_estoque) {
    alerts.push("LOW_ESTOQUE");
  }

  if (
    item.nearest_expiry &&
    isWithinLeadTime(item.nearest_expiry, item.expiry_lead_time)
  ) {
    alerts.push("EXPIRING_SOON");
  }

  return alerts;
}

function listAlerts(query) {
  const alertType = (query.alert_type || "ALL").toUpperCase();
  const acceptedTypes = new Set(["LOW_STOCK", "LOW_ESTOQUE", "EXPIRING_SOON", "ALL"]);

  if (!acceptedTypes.has(alertType)) {
    throw createAppError(400, "INVALID_ALERT_TYPE", "alert_type invalido.");
  }

  const data = itemModel
    .list()
    .map((item) => ({
      item,
      alerts: buildAlertsForItem(item)
    }))
    .filter((entry) => entry.alerts.length > 0)
    .filter((entry) => {
      if (alertType === "ALL") return true;
      if (alertType === "LOW_STOCK" || alertType === "LOW_ESTOQUE") {
        return entry.alerts.includes("LOW_ESTOQUE");
      }
      return entry.alerts.includes("EXPIRING_SOON");
    })
    .map((entry) => ({
      item: serializeItem(entry.item),
      alerts: entry.alerts
    }));

  return { data };
}


function refreshNearestExpiry(itemId) {
  const parsedItemId = parseInteger(itemId, "item_id", { min: 1 });

  const item = itemModel.findById(parsedItemId);

  if (!item) return;

  const nearestExpiry =
    movementModel
      .listByItemId(parsedItemId)
      .filter((movement) => movement.type === "INPUT" && movement.expiry_date)
      .map((movement) => movement.expiry_date)
      .sort(compareDdMmYyyy)[0] || null;

  itemModel.update(parsedItemId, {
    nearest_expiry: nearestExpiry,
    updated_at: new Date().toISOString()
  });
}



module.exports = {
  createItem,
  listItems,
  updateItem,
  listAlerts,
  refreshNearestExpiry,
};