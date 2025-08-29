const mongoose = require("mongoose");

const gpsSchema = new mongoose.Schema({
  route: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  stopName: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GpsLocation", gpsSchema);
