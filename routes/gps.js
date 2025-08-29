const express = require("express");
const router = express.Router();
const gpsController = require("../controllers/gpsController");

router.get("/update_location", gpsController.updateLocation);
router.get("/latest_location/:route", gpsController.getLatestLocation);

module.exports = router;