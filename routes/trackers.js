const express = require('express');
const router = express.Router();
const {
  updateTrackerLocation,
  getAllTrackers,
  getTrackerById,
  getTrackerByRoute,
  updateTrackerStatus,
  getTrackerDashboardSummary,
  deleteTracker
} = require('../controllers/trackerController');

// Update tracker location
router.post('/update-location', updateTrackerLocation);

// Get all active trackers
router.get('/', getAllTrackers);

// Get tracker by ID
router.get('/:trackerId', getTrackerById);

// Get tracker by route ID
router.get('/route/:routeId', getTrackerByRoute);

// Update tracker status
router.patch('/:trackerId/status', updateTrackerStatus);

// Get tracker dashboard summary
router.get('/dashboard/summary', getTrackerDashboardSummary);

// Delete tracker
router.delete('/:trackerId', deleteTracker);

module.exports = router;
