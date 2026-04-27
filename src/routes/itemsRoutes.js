const express = require("express");

const itemsController = require("../controllers/itemsController");

const router = express.Router();

router.post("/", itemsController.createItem);
router.get("/", itemsController.listItems);
router.get("/alerts", itemsController.listAlerts);
router.patch("/:id", itemsController.updateItem);

module.exports = router;
