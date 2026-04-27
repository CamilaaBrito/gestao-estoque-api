const express = require("express");

const movementsController = require("../controllers/movementsController");

const router = express.Router();

router.post("/", movementsController.createMovement);
router.get("/:item_id", movementsController.listItemMovements);
router.put("/:item_id", movementsController.methodNotAllowed);
router.delete("/:item_id", movementsController.methodNotAllowed);

module.exports = router;
