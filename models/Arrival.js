const mongoose = require('mongoose');

const arrivalSchema = new mongoose.Schema({
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
  stopName: {
    type: String,
    required: true,
    index: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  actualTime: {
    type: String,
    required: true
  },
  arrivalTimestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  delay: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['on_time', 'delayed', 'early'],
    default: 'on_time'
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  occupancy: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  weather: {
    type: String,
    default: 'clear'
  },
  trafficCondition: {
    type: String,
    enum: ['light', 'moderate', 'heavy'],
    default: 'moderate'
  },
  driverNotes: {
    type: String,
    default: ''
  },
  passengerCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
arrivalSchema.index({ routeId: 1, stopName: 1, arrivalTimestamp: -1 });
arrivalSchema.index({ busNumber: 1, arrivalTimestamp: -1 });
arrivalSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate delay and status
arrivalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate delay in minutes
  if (this.scheduledTime && this.actualTime) {
    const scheduled = this.parseTimeToMinutes(this.scheduledTime);
    const actual = this.parseTimeToMinutes(this.actualTime);
    this.delay = actual - scheduled;
    
    // Determine status based on delay
    if (this.delay <= 0) {
      this.status = 'on_time';
    } else if (this.delay <= 5) {
      this.status = 'on_time';
    } else {
      this.status = 'delayed';
    }
  }
  
  next();
});

// Helper method to parse time string to minutes
arrivalSchema.methods.parseTimeToMinutes = function(timeStr) {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes = minutes;
  }
  
  return totalMinutes;
};

// Static method to get arrival statistics
arrivalSchema.statics.getArrivalStats = async function(routeId, date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  const stats = await this.aggregate([
    {
      $match: {
        routeId: routeId,
        arrivalTimestamp: { $gte: startDate, $lte: endDate }
      }
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
        avgPassengerCount: { $avg: '$passengerCount' }
      }
    }
  ]);
  
  return stats;
};

// Static method to get recent arrivals
arrivalSchema.statics.getRecentArrivals = async function(routeId, limit = 10) {
  return await this.find({ routeId: routeId })
    .sort({ arrivalTimestamp: -1 })
    .limit(limit)
    .select('stopName scheduledTime actualTime delay status arrivalTimestamp');
};

// Static method to get today's arrivals
arrivalSchema.statics.getTodayArrivals = async function(routeId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return await this.find({
    routeId: routeId,
    arrivalTimestamp: { $gte: today, $lt: tomorrow }
  }).sort({ arrivalTimestamp: 1 });
};

module.exports = mongoose.model('Arrival', arrivalSchema);






