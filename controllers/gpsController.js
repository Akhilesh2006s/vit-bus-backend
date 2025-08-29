const GpsLocation = require("../models/GpsLocation");

exports.updateLocation = async (req, res) => {
    const { lat, lon, route } = req.query;
    if (!lat || !lon || !route) return res.status(400).json({ error: "Missing lat, lon, or route" });

    try {
        const newLocation = new GpsLocation({ lat, lon, route });
        await newLocation.save();
        res.json({ success: true, lat, lon, route });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getLatestLocation = async (req, res) => {
    try {
        const data = await GpsLocation.findOne({ route: req.params.route }).sort({ timestamp: -1 });
        res.json(data || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};