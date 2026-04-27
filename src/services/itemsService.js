const { randomUUID } = require("crypto");

const itemModel = require("../models/itemModel");
const movementModel = require("../models/movementModel");
const {
  parseDecimal,
  formatQuantity,
  toQuantityNumber,
  parseInteger
} = require("../utils/numberUtils");
const {
  isValidDdMmYyyy,
  compareDdMmYyyy,
  isWithinLeadTime
} = require("../utils/dateUtils");
const { buildPageResponse, paginate } = require("../utils/pagination");
const { createAppError } = require("../utils/errors");

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
    parseDecimal(payload.total_quantity, "total_quantity", 3);
  }

  if (!partial || minEstoque !== undefined) {
    parseDecimal(minEstoque, "min_estoque", 3);
  }

  if (!partial || payload.expiry_lead_time !== undefined) {
    parseInteger(payload.expiry_lead_time, "expiry_lead_time");
  }

  if (payload.nearest_expiry !== undefined && payload.nearest_expiry !== null && !isValidDdMmYyyy(payload.nearest_expiry)) {
    throw createAppError(400, "INVALID_DATE", "nearest_expiry deve estar no formato DD-MM-YYYY.");
  }

  if (payload.is_active !== undefined && typeof payload.is_active !== "boolean") {
    throw createAppError(400, "INVALID_STATUS", "is_active deve ser boolean.");
  }
}

function serializeItem(item) {
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    total_quantity: formatQuantity(item.total_quantity),
    min_estoque: formatQuantity(item.min_estoque),
    nearest_expiry: item.nearest_expiry,
    expiry_lead_time: item.expiry_lead_time,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

function createItem(payload) {
  validateItemPayload(payload);

  const now = new Date().toISOString();
  const item = {
    id: randomUUID(),
    name: payload.name.trim(),
    unit: payload.unit,
    total_quantity: toQuantityNumber(payload.total_quantity),
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

  const item = itemModel.findById(id);

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

  changes.updated_at = new Date().toISOString();

  itemModel.update(id, changes);

  return serializeItem(item);
}

function buildAlertsForItem(item) {
  const alerts = [];

  if (item.total_quantity <= item.min_estoque) {
    alerts.push("LOW_ESTOQUE");
  }

  if (item.nearest_expiry && isWithinLeadTime(item.nearest_expiry, item.expiry_lead_time)) {
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
      if (alertType === "ALL") {
        return true;
      }

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
  const item = itemModel.findById(itemId);

  if (!item) {
    return;
  }

  const nearestExpiry = movementModel
    .listByItemId(itemId)
    .filter((movement) => movement.type === "INPUT" && movement.expiry_date)
    .map((movement) => movement.expiry_date)
    .sort(compareDdMmYyyy)[0] || null;

  itemModel.update(itemId, {
    nearest_expiry: nearestExpiry,
    updated_at: new Date().toISOString()
  });
}

module.exports = {
  createItem,
  listItems,
  updateItem,
  listAlerts,
  refreshNearestExpiry
};
