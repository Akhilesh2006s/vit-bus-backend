const Arrival = require('../models/Arrival');

// Bulk delete arrivals
const bulkDeleteArrivals = async (req, res) => {
  try {
    const { ids, filters } = req.body;

    let query = {};

    if (ids && ids.length > 0) {
      query._id = { $in: ids };
    } else if (filters) {
      // Apply filters for bulk delete
      if (filters.routeId) query.routeId = filters.routeId;
      if (filters.busNumber) query.busNumber = filters.busNumber;
      if (filters.stopName) query.stopName = filters.stopName;
      if (filters.status) query.status = filters.status;
      if (filters.startDate || filters.endDate) {
        query.arrivalTimestamp = {};
        if (filters.startDate) query.arrivalTimestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.arrivalTimestamp.$lte = new Date(filters.endDate);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either ids array or filters object must be provided'
      });
    }

    const result = await Arrival.deleteMany(query);

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} arrivals`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error bulk deleting arrivals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Export arrivals data
const exportArrivals = async (req, res) => {
  try {
    const { format = 'json', filters = {} } = req.query;

    let query = {};

    // Apply filters
    if (filters.routeId) query.routeId = filters.routeId;
    if (filters.busNumber) query.busNumber = filters.busNumber;
    if (filters.stopName) query.stopName = filters.stopName;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.arrivalTimestamp = {};
      if (filters.startDate) query.arrivalTimestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.arrivalTimestamp.$lte = new Date(filters.endDate);
    }

    const arrivals = await Arrival.find(query).sort({ arrivalTimestamp: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = 'Route ID,Bus Number,Stop Name,Scheduled Time,Actual Time,Delay,Status,Occupancy,Passenger Count,Driver Notes,Weather,Traffic Condition,Arrival Timestamp\n';
      const csvData = arrivals.map(arrival => 
        `"${arrival.routeId}","${arrival.busNumber}","${arrival.stopName}","${arrival.scheduledTime}","${arrival.actualTime}","${arrival.delay}","${arrival.status}","${arrival.occupancy}","${arrival.passengerCount}","${arrival.driverNotes}","${arrival.weather}","${arrival.trafficCondition}","${arrival.arrivalTimestamp}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=arrivals_export.csv');
      res.send(csvHeaders + csvData);
    } else {
      // JSON format
      res.status(200).json({
        success: true,
        data: arrivals,
        count: arrivals.length,
        exportDate: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error exporting arrivals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get arrival summary by date range
const getArrivalSummary = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let groupStage = {};
    if (groupBy === 'day') {
      groupStage = {
        $dateToString: { format: "%Y-%m-%d", date: "$arrivalTimestamp" }
      };
    } else if (groupBy === 'week') {
      groupStage = {
        $dateToString: { format: "%Y-W%V", date: "$arrivalTimestamp" }
      };
    } else if (groupBy === 'month') {
      groupStage = {
        $dateToString: { format: "%Y-%m", date: "$arrivalTimestamp" }
      };
    }

    const summary = await Arrival.aggregate([
      {
        $match: {
          arrivalTimestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupStage,
          totalArrivals: { $sum: 1 },
          onTimeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'on_time'] }, 1, 0] }
          },
          delayedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] }
          },
          earlyCount: {
            $sum: { $cond: [{ $eq: ['$status', 'early'] }, 1, 0] }
          },
          avgDelay: { $avg: '$delay' },
          avgPassengerCount: { $avg: '$passengerCount' },
          totalPassengers: { $sum: '$passengerCount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: summary,
      period: { startDate, endDate, groupBy }
    });

  } catch (error) {
    console.error('Error getting arrival summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get route performance comparison
const getRoutePerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const performance = await Arrival.aggregate([
      {
        $match: {
          arrivalTimestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$routeId',
          totalArrivals: { $sum: 1 },
          onTimeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'on_time'] }, 1, 0] }
          },
          delayedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] }
          },
          avgDelay: { $avg: '$delay' },
          avgPassengerCount: { $avg: '$passengerCount' },
          totalPassengers: { $sum: '$passengerCount' },
          stops: { $addToSet: '$stopName' }
        }
      },
      {
        $addFields: {
          onTimePercentage: {
            $multiply: [
              { $divide: ['$onTimeCount', '$totalArrivals'] },
              100
            ]
          },
          stopCount: { $size: '$stops' }
        }
      },
      {
        $sort: { onTimePercentage: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: performance,
      period: { startDate, endDate }
    });

  } catch (error) {
    console.error('Error getting route performance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get stop performance analysis
const getStopPerformance = async (req, res) => {
  try {
    const { startDate, endDate, routeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let matchStage = {
      arrivalTimestamp: { $gte: start, $lte: end }
    };

    if (routeId) {
      matchStage.routeId = routeId;
    }

    const performance = await Arrival.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: '$stopName',
          totalArrivals: { $sum: 1 },
          onTimeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'on_time'] }, 1, 0] }
          },
          delayedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] }
          },
          avgDelay: { $avg: '$delay' },
          avgPassengerCount: { $avg: '$passengerCount' },
          totalPassengers: { $sum: '$passengerCount' },
          routes: { $addToSet: '$routeId' }
        }
      },
      {
        $addFields: {
          onTimePercentage: {
            $multiply: [
              { $divide: ['$onTimeCount', '$totalArrivals'] },
              100
            ]
          },
          routeCount: { $size: '$routes' }
        }
      },
      {
        $sort: { avgDelay: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: performance,
      period: { startDate, endDate, routeId }
    });

  } catch (error) {
    console.error('Error getting stop performance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  bulkDeleteArrivals,
  exportArrivals,
  getArrivalSummary,
  getRoutePerformance,
  getStopPerformance
};






