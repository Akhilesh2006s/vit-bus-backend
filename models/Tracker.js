const mongoose = require('mongoose');

const trackerSchema = new mongoose.Schema({
  trackerId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  trackerName: {
    type: String,
    required: true,
    trim: true
  },
  routeId: {
    type: String,
    required: true,
    index: true
  },
  busNumber: {
    type: String,
    required: true,
    index: true
  },
  currentLocation: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  currentArea: {
    type: String,
    required: true,
    trim: true
  },
  currentTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastUpdateTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  speed: {
    type: Number,
    default: 0 // in km/h
  },
  heading: {
    type: Number,
    default: 0 // in degrees
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  signalStrength: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
trackerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
trackerSchema.index({ routeId: 1, currentTime: -1 });
trackerSchema.index({ busNumber: 1, currentTime: -1 });
trackerSchema.index({ status: 1 });
trackerSchema.index({ isOnline: 1 });

module.exports = mongoose.model('Tracker', trackerSchema);


