const mongoose = require("mongoose");

const busRouteSchema = new mongoose.Schema({
    routeId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    routeName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    startLocation: {
        type: String,
        required: true
    },
    endLocation: {
        type: String,
        required: true
    },
    stops: [{
        name: {
            type: String,
            required: true
        },
        location: {
            lat: Number,
            lon: Number
        },
        scheduledTime: String,
        estimatedTime: String,
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    busCapacity: {
        type: Number,
        default: 50
    },
    currentPassengers: {
        type: Number,
        default: 0
    },
    driver: {
        name: String,
        phone: String,
        licenseNumber: String
    },
    vehicle: {
        number: String,
        model: String,
        capacity: Number
    },
    schedule: {
        weekday: {
            startTime: String,
            endTime: String,
            frequency: Number // minutes
        },
        weekend: {
            startTime: String,
            endTime: String,
            frequency: Number
        }
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
busRouteSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("BusRoute", busRouteSchema);

