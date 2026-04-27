const movementsService = require("../services/movementsService");

async function createMovement(request, response, next) {
  try {
    const movement = movementsService.createMovement(request.body);
    response.status(201).json(movement);
  } catch (error) {
    next(error);
  }
}

async function listItemMovements(request, response, next) {
  try {
    const result = movementsService.listItemMovements(request.params.item_id, request.query);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

async function methodNotAllowed(_request, _response, next) {
  next(
    movementsService.createMethodNotAllowedError(
      "Movimentacoes sao imutaveis. Utilize apenas POST para registo e GET para consulta."
    )
  );
}

module.exports = {
  createMovement,
  listItemMovements,
  methodNotAllowed
};
