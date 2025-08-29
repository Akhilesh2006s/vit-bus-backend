const express = require("express");
const router = express.Router();
const routeController = require("../controllers/routeController");

// Route management
router.get("/", routeController.getAllRoutes);
router.get("/:routeId", routeController.getRouteById);
router.get("/:routeId/with-location", routeController.getRouteWithLocation);
router.get("/:routeId/stats", routeController.getRouteStats);
router.post("/", routeController.createRoute);
router.put("/:routeId", routeController.updateRoute);
router.patch("/:routeId/status", routeController.updateRouteStatus);
router.delete("/:routeId", routeController.deleteRoute);

module.exports = router;






