const express = require("express");
const router = express.Router();
const gpsController = require("../controllers/gpsController");

router.get("/update", gpsController.updateLocation); // ?lat=...&lon=...&route=VV-12
router.get("/latest", (req, res) => gpsController.getLatestLocation({ ...req, params: { route: "VV-12" } }, res));

module.exports = router;