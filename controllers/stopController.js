const RouteStop = require("../models/RouteStop");
const GpsLocation = require("../models/GpsLocation");

exports.getStopsByRoute = async (req, res) => {
    try {
        const stops = await RouteStop.find({ route: req.params.route }).sort({ scheduledTime: 1 });
        res.json(stops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logStopTime = async (req, res) => {
    const { route, stopName, lat, lon } = req.body;
    if (!route || !stopName || !lat || !lon) return res.status(400).json({ error: "Missing data" });

    try {
        const log = new GpsLocation({ route, stopName, lat, lon });
        await log.save();
        res.json({ success: true, stop: stopName, time: log.timestamp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRouteHistory = async (req, res) => {
    try {
        const logs = await GpsLocation.find({ route: req.params.route, stopName: { $exists: true } }).sort({ timestamp: 1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};