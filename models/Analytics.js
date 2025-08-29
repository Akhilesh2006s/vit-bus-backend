const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['delay', 'breakdown', 'crowding', 'safety', 'other']
    },
    severity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical']
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    resolved: {
        type: Boolean,
        default: false
    },
    resolvedBy: {
        type: String
    },
    resolvedAt: {
        type: Date
    }
});

const stopSchema = new mongoose.Schema({
    stopId: {
        type: String,
        required: true
    },
    stopName: {
        type: String,
        required: true
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    actualTime: {
        type: Date
    },
    delay: {
        type: Number,
        default: 0
    },
    passengers: {
        type: Number,
        default: 0
    }
});

const analyticsSchema = new mongoose.Schema({
    routeId: {
        type: String,
        required: true,
        uppercase: true
    },
    date: {
        type: Date,
        required: true
    },
    metrics: {
        totalTrips: {
            type: Number,
            default: 0
        },
        totalPassengers: {
            type: Number,
            default: 0
        },
        averageDelay: {
            type: Number,
            default: 0
        },
        onTimePercentage: {
            type: Number,
            default: 0
        },
        totalDistance: {
            type: Number,
            default: 0
        },
        fuelConsumption: {
            type: Number,
            default: 0
        },
        maintenanceIssues: {
            type: Number,
            default: 0
        }
    },
    stops: [stopSchema],
    issues: [issueSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for efficient queries
analyticsSchema.index({ routeId: 1, date: 1 });

// Update the updatedAt field before saving
analyticsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Analytics', analyticsSchema);





