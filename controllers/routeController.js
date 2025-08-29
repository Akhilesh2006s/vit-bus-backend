const BusRoute = require("../models/BusRoute");
const GpsLocation = require("../models/GpsLocation");

// Get all routes
exports.getAllRoutes = async (req, res) => {
    try {
        const routes = await BusRoute.find({ isActive: true }).sort({ routeId: 1 });
        res.json({
            success: true,
            routes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get route by ID
exports.getRouteById = async (req, res) => {
    try {
        const { routeId } = req.params;
        const route = await BusRoute.findOne({ routeId: routeId.toUpperCase() });

        if (!route) {
            return res.status(404).json({ error: "Route not found" });
        }

        res.json({
            success: true,
            route
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create new route
exports.createRoute = async (req, res) => {
    try {
        const routeData = req.body;
        
        // Check if route already exists
        const existingRoute = await BusRoute.findOne({ routeId: routeData.routeId.toUpperCase() });
        if (existingRoute) {
            return res.status(400).json({ error: "Route already exists" });
        }

        const route = new BusRoute(routeData);
        await route.save();

        res.status(201).json({
            success: true,
            route
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update route
exports.updateRoute = async (req, res) => {
    try {
        const { routeId } = req.params;
        const updateData = req.body;

        const route = await BusRoute.findOneAndUpdate(
            { routeId: routeId.toUpperCase() },
            updateData,
            { new: true, runValidators: true }
        );

        if (!route) {
            return res.status(404).json({ error: "Route not found" });
        }

        res.json({
            success: true,
            route
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete route
exports.deleteRoute = async (req, res) => {
    try {
        const { routeId } = req.params;
        const route = await BusRoute.findOneAndDelete({ routeId: routeId.toUpperCase() });

        if (!route) {
            return res.status(404).json({ error: "Route not found" });
        }

        res.json({
            success: true,
            message: "Route deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get route with real-time location
exports.getRouteWithLocation = async (req, res) => {
    try {
        const { routeId } = req.params;
        const route = await BusRoute.findOne({ routeId: routeId.toUpperCase() });

        if (!route) {
            return res.status(404).json({ error: "Route not found" });
        }

        // Get latest GPS location
        const latestLocation = await GpsLocation.findOne({ 
            route: routeId.toUpperCase() 
        }).sort({ timestamp: -1 });

        res.json({
            success: true,
            route: {
                ...route.toObject(),
                currentLocation: latestLocation || null
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update route status
exports.updateRouteStatus = async (req, res) => {
    try {
        const { routeId } = req.params;
        const { isActive, currentPassengers } = req.body;

        const updateData = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (currentPassengers !== undefined) updateData.currentPassengers = currentPassengers;

        const route = await BusRoute.findOneAndUpdate(
            { routeId: routeId.toUpperCase() },
            updateData,
            { new: true }
        );

        if (!route) {
            return res.status(404).json({ error: "Route not found" });
        }

        res.json({
            success: true,
            route
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get route statistics
exports.getRouteStats = async (req, res) => {
    try {
        const { routeId } = req.params;
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get GPS data for the period
        const gpsData = await GpsLocation.find({
            route: routeId.toUpperCase(),
            timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 });

        // Calculate statistics
        const totalTrips = gpsData.length;
        const uniqueDays = [...new Set(gpsData.map(d => d.timestamp.toDateString()))].length;
        const avgTripsPerDay = uniqueDays > 0 ? totalTrips / uniqueDays : 0;

        res.json({
            success: true,
            stats: {
                routeId: routeId.toUpperCase(),
                period: `${days} days`,
                totalTrips,
                uniqueDays,
                avgTripsPerDay: Math.round(avgTripsPerDay * 100) / 100,
                lastUpdate: gpsData.length > 0 ? gpsData[gpsData.length - 1].timestamp : null
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};