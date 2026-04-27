const express = require("express");

const authRoutes = require("./authRoutes");
const itemsRoutes = require("./itemsRoutes");
const movementsRoutes = require("./movementsRoutes");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.use("/auth", authRoutes);
router.use(authenticate);
router.use("/items", itemsRoutes);
router.use("/movements", movementsRoutes);

module.exports = router;
