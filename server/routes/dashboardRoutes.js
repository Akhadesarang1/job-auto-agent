const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, dashboardController.getDashboardStats);
router.get("/registrations", auth, dashboardController.getRegistrations);

module.exports = router;
