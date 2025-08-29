const express = require('express');
const router = express.Router();
const {
  recordArrival,
  getRouteArrivals,
  getTodayArrivals,
  getArrivalStats,
  getRecentArrivals,
  getAllArrivals,
  updateArrival,
  deleteArrival,
  getArrivalAnalytics
} = require('../controllers/arrivalController');

const {
  bulkDeleteArrivals,
  exportArrivals,
  getArrivalSummary,
  getRoutePerformance,
  getStopPerformance
} = require('../controllers/arrivalBulkController');

// Record a new arrival
router.post('/', recordArrival);

// Get all arrivals with filters
router.get('/', getAllArrivals);

// Get arrivals for a specific route
router.get('/route/:routeId', getRouteArrivals);

// Get today's arrivals for a route
router.get('/route/:routeId/today', getTodayArrivals);

// Get arrival statistics for a route
router.get('/route/:routeId/stats', getArrivalStats);

// Get recent arrivals for a route
router.get('/route/:routeId/recent', getRecentArrivals);

// Get arrival analytics for a route
router.get('/route/:routeId/analytics', getArrivalAnalytics);

// Update arrival record
router.put('/:id', updateArrival);

// Delete arrival record
router.delete('/:id', deleteArrival);

// Bulk operations
router.delete('/bulk', bulkDeleteArrivals);
router.get('/export', exportArrivals);
router.get('/summary', getArrivalSummary);
router.get('/performance/routes', getRoutePerformance);
router.get('/performance/stops', getStopPerformance);

module.exports = router;
