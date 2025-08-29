const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// Analytics routes
router.post("/update", analyticsController.updateAnalytics);
router.get("/route/:routeId", analyticsController.getRouteAnalytics);
router.get("/dashboard/summary", analyticsController.getDashboardSummary);
router.get("/route/:routeId/performance", analyticsController.getPerformanceComparison);
router.get("/issues", analyticsController.getIssueReports);
router.patch("/:analyticsId/issues/:issueId/resolve", analyticsController.resolveIssue);

module.exports = router;






