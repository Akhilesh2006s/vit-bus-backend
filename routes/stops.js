const express = require("express");
const router = express.Router();
const stopController = require("../controllers/stopController");

router.get("/:route", stopController.getStopsByRoute);
router.post("/log_stop_time", stopController.logStopTime);
router.get("/history/:route", stopController.getRouteHistory);

module.exports = router;