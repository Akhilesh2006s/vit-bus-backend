const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ MongoDB Connected");
    testTrackerData();
}).catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
});

const Tracker = require('./models/Tracker');

async function testTrackerData() {
    try {
        console.log('\n🔍 Testing Tracker Data...\n');

        // 1. Get all trackers (including offline ones)
        const allTrackers = await Tracker.find({}).sort({ trackerId: 1 });
        console.log(`📊 Total trackers in database: ${allTrackers.length}`);

        // 2. Get only online trackers (what the API currently returns)
        const onlineTrackers = await Tracker.find({ isOnline: true }).sort({ trackerId: 1 });
        console.log(`🟢 Online trackers: ${onlineTrackers.length}`);

        // 3. Get offline trackers
        const offlineTrackers = await Tracker.find({ isOnline: false }).sort({ trackerId: 1 });
        console.log(`🔴 Offline trackers: ${offlineTrackers.length}`);

        // 4. Show tracker IDs
        console.log('\n📋 All tracker IDs:');
        allTrackers.forEach(tracker => {
            console.log(`   ID: ${tracker.trackerId}, Online: ${tracker.isOnline}, Last Update: ${tracker.lastUpdateTime}`);
        });

        // 5. Check if there are trackers with ID > 645
        const highIdTrackers = allTrackers.filter(t => parseInt(t.trackerId) > 645);
        console.log(`\n🔝 Trackers with ID > 645: ${highIdTrackers.length}`);
        highIdTrackers.forEach(tracker => {
            console.log(`   ID: ${tracker.trackerId}, Online: ${tracker.isOnline}, Last Update: ${tracker.lastUpdateTime}`);
        });

        // 6. Check online status of high ID trackers
        const highIdOnlineTrackers = highIdTrackers.filter(t => t.isOnline);
        console.log(`\n🟢 High ID trackers that are online: ${highIdOnlineTrackers.length}`);

        // 7. Check offline status of high ID trackers
        const highIdOfflineTrackers = highIdTrackers.filter(t => !t.isOnline);
        console.log(`🔴 High ID trackers that are offline: ${highIdOfflineTrackers.length}`);

        console.log('\n✅ Test completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error testing tracker data:', error);
        process.exit(1);
    }
}
