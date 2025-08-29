const Tracker = require('../models/Tracker');

// Update tracker location and information
exports.updateTrackerLocation = async (req, res) => {
  try {
    const {
      trackerId,
      trackerName,
      routeId,
      busNumber,
      lat,
      lng,
      area,
      speed = 0,
      heading = 0,
      batteryLevel = 100,
      signalStrength = 100
    } = req.body;

    // Validate required fields
    if (!trackerId || !trackerName || !routeId || !busNumber || !lat || !lng || !area) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: trackerId, trackerName, routeId, busNumber, lat, lng, area'
      });
    }

    // Find existing tracker or create new one
    let tracker = await Tracker.findOne({ trackerId });

    if (tracker) {
      // Update existing tracker
      tracker.trackerName = trackerName;
      tracker.routeId = routeId;
      tracker.busNumber = busNumber;
      tracker.currentLocation = { lat, lng };
      tracker.currentArea = area;
      tracker.currentTime = new Date();
      tracker.lastUpdateTime = new Date();
      tracker.speed = speed;
      tracker.heading = heading;
      tracker.batteryLevel = batteryLevel;
      tracker.signalStrength = signalStrength;
      tracker.isOnline = true;
    } else {
      // Create new tracker
      tracker = new Tracker({
        trackerId,
        trackerName,
        routeId,
        busNumber,
        currentLocation: { lat, lng },
        currentArea: area,
        currentTime: new Date(),
        lastUpdateTime: new Date(),
        speed,
        heading,
        batteryLevel,
        signalStrength,
        isOnline: true
      });
    }

    await tracker.save();

    res.status(200).json({
      success: true,
      message: 'Tracker location updated successfully',
      data: tracker
    });

  } catch (error) {
    console.error('Error updating tracker location:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all trackers (including offline ones)
exports.getAllTrackers = async (req, res) => {
  try {
    const { routeId, busNumber, status, onlineOnly } = req.query;
    
    let query = {};
    
    // Only filter by online status if explicitly requested
    if (onlineOnly === 'true') {
      query.isOnline = true;
    }
    
    if (routeId) query.routeId = routeId;
    if (busNumber) query.busNumber = busNumber;
    if (status) query.status = status;

    const trackers = await Tracker.find(query)
      .sort({ lastUpdateTime: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: trackers,
      count: trackers.length
    });

  } catch (error) {
    console.error('Error fetching trackers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get tracker by ID
exports.getTrackerById = async (req, res) => {
  try {
    const { trackerId } = req.params;
    
    const tracker = await Tracker.findOne({ trackerId });
    
    if (!tracker) {
      return res.status(404).json({
        success: false,
        message: 'Tracker not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tracker
    });

  } catch (error) {
    console.error('Error fetching tracker:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get tracker by route ID
exports.getTrackerByRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const tracker = await Tracker.findOne({ routeId, isOnline: true })
      .sort({ lastUpdateTime: -1 });
    
    if (!tracker) {
      return res.status(404).json({
        success: false,
        message: 'No active tracker found for this route'
      });
    }

    res.status(200).json({
      success: true,
      data: tracker
    });

  } catch (error) {
    console.error('Error fetching tracker by route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update tracker status
exports.updateTrackerStatus = async (req, res) => {
  try {
    const { trackerId } = req.params;
    const { status, isOnline } = req.body;

    const tracker = await Tracker.findOne({ trackerId });
    
    if (!tracker) {
      return res.status(404).json({
        success: false,
        message: 'Tracker not found'
      });
    }

    if (status) tracker.status = status;
    if (typeof isOnline === 'boolean') tracker.isOnline = isOnline;
    
    tracker.lastUpdateTime = new Date();
    await tracker.save();

    res.status(200).json({
      success: true,
      message: 'Tracker status updated successfully',
      data: tracker
    });

  } catch (error) {
    console.error('Error updating tracker status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get tracker dashboard summary
exports.getTrackerDashboardSummary = async (req, res) => {
  try {
    const totalTrackers = await Tracker.countDocuments();
    const activeTrackers = await Tracker.countDocuments({ isOnline: true });
    const inactiveTrackers = await Tracker.countDocuments({ isOnline: false });
    const maintenanceTrackers = await Tracker.countDocuments({ status: 'maintenance' });

    // Get trackers by route
    const trackersByRoute = await Tracker.aggregate([
      { $group: { _id: '$routeId', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get recent activity (trackers updated in last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentActivity = await Tracker.countDocuments({
      lastUpdateTime: { $gte: yesterday }
    });

    res.status(200).json({
      success: true,
      summary: {
        totalTrackers,
        activeTrackers,
        inactiveTrackers,
        maintenanceTrackers,
        recentActivity
      },
      trackersByRoute
    });

  } catch (error) {
    console.error('Error fetching tracker dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all trackers without any filtering (for debugging)
exports.getAllTrackersDebug = async (req, res) => {
  try {
    const trackers = await Tracker.find({})
      .sort({ trackerId: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: trackers,
      count: trackers.length,
      debug: {
        totalInDB: await Tracker.countDocuments({}),
        onlineCount: await Tracker.countDocuments({ isOnline: true }),
        offlineCount: await Tracker.countDocuments({ isOnline: false })
      }
    });

  } catch (error) {
    console.error('Error fetching all trackers (debug):', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete tracker
exports.deleteTracker = async (req, res) => {
  try {
    const { trackerId } = req.params;
    
    const tracker = await Tracker.findOneAndDelete({ trackerId });
    
    if (!tracker) {
      return res.status(404).json({
        success: false,
        message: 'Tracker not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tracker deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting tracker:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
