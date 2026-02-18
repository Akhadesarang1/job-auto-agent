const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", auth, upload.single("resume"), uploadController.uploadResume);

module.exports = router;
