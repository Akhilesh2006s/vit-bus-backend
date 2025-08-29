require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ MongoDB Connected");
}).catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
});

// Debug: Log all registered routes
const routes = require("./routes/index");
console.log("🔍 Registering routes...");

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", routes);

// Debug: Log all registered routes after mounting
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log(`📍 Route: ${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                console.log(`📍 Route: ${handler.route.stack[0].method.toUpperCase()} /api${handler.route.path}`);
            }
        });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});