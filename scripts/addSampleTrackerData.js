const mongoose = require('mongoose');
const Tracker = require('../models/Tracker');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vit-bus-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleTrackerData = [
  {
    trackerId: 'TRK001',
    trackerName: 'VIT-AP Bus Tracker 1',
    routeId: 'VV1',
    busNumber: 'AP16AB1234',
    currentLocation: {
      lat: 16.5062,
      lng: 80.6480
    },
    currentArea: 'Kankipadu',
    currentTime: new Date(),
    lastUpdateTime: new Date(),
    status: 'active',
    speed: 35,
    heading: 45,
    batteryLevel: 85,
    signalStrength: 90,
    isOnline: true
  },
  {
    trackerId: 'TRK002',
    trackerName: 'VIT-AP Bus Tracker 2',
    routeId: 'GV1',
    busNumber: 'AP16CD5678',
    currentLocation: {
      lat: 16.5062,
      lng: 80.6480
    },
    currentArea: 'Gannavaram',
    currentTime: new Date(),
    lastUpdateTime: new Date(),
    status: 'active',
    speed: 42,
    heading: 120,
    batteryLevel: 92,
    signalStrength: 95,
    isOnline: true
  },
  {
    trackerId: 'TRK003',
    trackerName: 'VIT-AP Bus Tracker 3',
    routeId: 'VV2',
    busNumber: 'AP16EF9012',
    currentLocation: {
      lat: 16.5062,
      lng: 80.6480
    },
    currentArea: 'Vijayawada',
    currentTime: new Date(),
    lastUpdateTime: new Date(),
    status: 'active',
    speed: 28,
    heading: 90,
    batteryLevel: 78,
    signalStrength: 85,
    isOnline: true
  }
];

async function addSampleTrackerData() {
  try {
    console.log('Adding sample tracker data...');
    
    // Clear existing tracker data
    await Tracker.deleteMany({});
    console.log('Cleared existing tracker data');
    
    // Insert sample data
    const result = await Tracker.insertMany(sampleTrackerData);
    console.log(`Successfully added ${result.length} tracker records`);
    
    // Display the added data
    const trackers = await Tracker.find({});
    console.log('\nAdded tracker data:');
    trackers.forEach(tracker => {
      console.log(`- ${tracker.trackerName} (${tracker.trackerId}) - Route: ${tracker.routeId}, Area: ${tracker.currentArea}`);
    });
    
  } catch (error) {
    console.error('Error adding sample tracker data:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
addSampleTrackerData();


