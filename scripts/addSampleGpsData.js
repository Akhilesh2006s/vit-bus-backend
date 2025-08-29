const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ MongoDB Connected");
}).catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
});

// GPS Location Schema
const gpsSchema = new mongoose.Schema({
    route: String,
    lat: Number,
    lon: Number,
    stopName: String,
    timestamp: { type: Date, default: Date.now }
});

const GpsLocation = mongoose.model("GpsLocation", gpsSchema);

// Sample GPS data for VV-12 (VV1 route)
const vv12SampleData = [
    { route: "VV-12", lat: 16.52746, lng: 80.628769, stopName: "Kankipadu" },
    { route: "VV-12", lat: 16.5292, lng: 80.6310, stopName: "Gosala" },
    { route: "VV-12", lat: 16.5282, lng: 80.6292, stopName: "Edupugallu" },
    { route: "VV-12", lat: 16.5120, lng: 80.6204, stopName: "Penumaluru" },
    { route: "VV-12", lat: 16.5032, lng: 80.6310, stopName: "Poranki" }
];

// Sample GPS data for VV-11 (VV2 route)
const vv11SampleData = [
    { route: "VV-11", lat: 16.52746, lng: 80.628769, stopName: "Kankipadu" },
    { route: "VV-11", lat: 16.5292, lng: 80.6310, stopName: "Gosala" },
    { route: "VV-11", lat: 16.5282, lng: 80.6292, stopName: "Edupugallu" },
    { route: "VV-11", lat: 16.5120, lng: 80.6204, stopName: "Penumaluru" },
    { route: "VV-11", lat: 16.5032, lng: 80.6310, stopName: "Poranki" }
];

async function addSampleGpsData() {
    try {
        // Clear existing data
        await GpsLocation.deleteMany({ route: { $in: ["VV-11", "VV-12"] } });
        console.log("🗑️ Cleared existing GPS data for VV-11 and VV-12");

        // Add VV-12 data with timestamps
        for (let i = 0; i < vv12SampleData.length; i++) {
            const data = vv12SampleData[i];
            const timestamp = new Date();
            timestamp.setMinutes(timestamp.getMinutes() - (vv12SampleData.length - i) * 5); // 5 minutes apart
            
            await GpsLocation.create({
                ...data,
                lon: data.lng, // Convert lng to lon for MongoDB schema
                timestamp: timestamp
            });
        }
        console.log("✅ Added VV-12 sample GPS data");

        // Add VV-11 data with timestamps
        for (let i = 0; i < vv11SampleData.length; i++) {
            const data = vv11SampleData[i];
            const timestamp = new Date();
            timestamp.setMinutes(timestamp.getMinutes() - (vv11SampleData.length - i) * 5); // 5 minutes apart
            
            await GpsLocation.create({
                ...data,
                lon: data.lng, // Convert lng to lon for MongoDB schema
                timestamp: timestamp
            });
        }
        console.log("✅ Added VV-11 sample GPS data");

        // Add current live location for VV-12 (most recent)
        await GpsLocation.create({
            route: "VV-12",
            lat: 16.5282,
            lon: 80.6292,
            stopName: "Edupugallu",
            timestamp: new Date()
        });
        console.log("📍 Added current live location for VV-12");

        // Add current live location for VV-11 (most recent)
        await GpsLocation.create({
            route: "VV-11",
            lat: 16.5292,
            lon: 80.6310,
            stopName: "Gosala",
            timestamp: new Date()
        });
        console.log("📍 Added current live location for VV-11");

        console.log("🎉 Sample GPS data added successfully!");
        
        // Show the latest locations
        const latestVV12 = await GpsLocation.findOne({ route: "VV-12" }).sort({ timestamp: -1 });
        const latestVV11 = await GpsLocation.findOne({ route: "VV-11" }).sort({ timestamp: -1 });
        
        console.log("\n📍 Latest GPS Locations:");
        console.log(`VV-12: ${latestVV12.lat}, ${latestVV12.lon} (${latestVV12.stopName})`);
        console.log(`VV-11: ${latestVV11.lat}, ${latestVV11.lon} (${latestVV11.stopName})`);

    } catch (error) {
        console.error("❌ Error adding sample GPS data:", error);
    } finally {
        mongoose.connection.close();
        console.log("🔌 MongoDB connection closed");
    }
}

// Run the script
addSampleGpsData();

