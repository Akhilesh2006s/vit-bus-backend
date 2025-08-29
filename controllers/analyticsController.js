const Analytics = require("../models/Analytics");
const GpsLocation = require("../models/GpsLocation");
const BusRoute = require("../models/BusRoute");

// Create or update analytics for a route
exports.updateAnalytics = async (req, res) => {
    try {
        const { routeId, metrics, stops, issues } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find existing analytics for today
        let analytics = await Analytics.findOne({
            routeId: routeId.toUpperCase(),
            date: today
        });

        if (analytics) {
            // Update existing analytics
            if (metrics) {
                analytics.metrics = { ...analytics.metrics, ...metrics };
            }
            if (stops) {
                analytics.stops = [...analytics.stops, ...stops];
            }
            if (issues) {
                analytics.issues = [...analytics.issues, ...issues];
            }
        } else {
            // Create new analytics
            analytics = new Analytics({
                routeId: routeId.toUpperCase(),
                date: today,
                metrics: metrics || {},
                stops: stops || [],
                issues: issues || []
            });
        }

        await analytics.save();

        res.json({
            success: true,
            analytics
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get analytics for a specific route and date range
exports.getRouteAnalytics = async (req, res) => {
    try {
        const { routeId } = req.params;
        const { startDate, endDate, days = 7 } = req.query;

        let query = { routeId: routeId.toUpperCase() };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));
            query.date = { $gte: startDate, $lte: endDate };
        }

        const analytics = await Analytics.find(query).sort({ date: 1 });

        res.json({
            success: true,
            analytics
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get dashboard summary
exports.getDashboardSummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get today's analytics for all routes
        const todayAnalytics = await Analytics.find({ date: today });

        // Get all active routes
        const activeRoutes = await BusRoute.find({ isActive: true });

        // Calculate summary statistics
        const summary = {
            totalRoutes: activeRoutes.length,
            activeRoutes: activeRoutes.length,
            totalTrips: 0,
            totalPassengers: 0,
            averageDelay: 0,
            issues: {
                low: 0,
                medium: 0,
                high: 0,
                critical: 0
            }
        };

        todayAnalytics.forEach(analytics => {
            summary.totalTrips += analytics.metrics.totalTrips || 0;
            summary.totalPassengers += analytics.metrics.totalPassengers || 0;
            
            analytics.issues.forEach(issue => {
                if (!issue.resolved) {
                    summary.issues[issue.severity]++;
                }
            });
        });

        if (todayAnalytics.length > 0) {
            const totalDelay = todayAnalytics.reduce((sum, analytics) => 
                sum + (analytics.metrics.averageDelay || 0), 0);
            summary.averageDelay = Math.round(totalDelay / todayAnalytics.length);
        }

        res.json({
            success: true,
            summary
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get performance comparison
exports.getPerformanceComparison = async (req, res) => {
    try {
        const { routeId } = req.params;
        const { period = 7 } = req.query;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get analytics for the period
        const analytics = await Analytics.find({
            routeId: routeId.toUpperCase(),
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        // Calculate performance metrics
        const performance = {
            routeId: routeId.toUpperCase(),
            period: `${period} days`,
            totalTrips: 0,
            totalPassengers: 0,
            averageDelay: 0,
            onTimePercentage: 0,
            dailyStats: []
        };

        analytics.forEach(day => {
            performance.totalTrips += day.metrics.totalTrips || 0;
            performance.totalPassengers += day.metrics.totalPassengers || 0;
            
            performance.dailyStats.push({
                date: day.date,
                trips: day.metrics.totalTrips || 0,
                passengers: day.metrics.totalPassengers || 0,
                delay: day.metrics.averageDelay || 0,
                onTime: day.metrics.onTimePercentage || 0
            });
        });

        if (analytics.length > 0) {
            const totalDelay = analytics.reduce((sum, day) => 
                sum + (day.metrics.averageDelay || 0), 0);
            performance.averageDelay = Math.round(totalDelay / analytics.length);

            const totalOnTime = analytics.reduce((sum, day) => 
                sum + (day.metrics.onTimePercentage || 0), 0);
            performance.onTimePercentage = Math.round(totalOnTime / analytics.length);
        }

        res.json({
            success: true,
            performance
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get issue reports
exports.getIssueReports = async (req, res) => {
    try {
        const { routeId, severity, resolved } = req.query;
        const { days = 30 } = req.query;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        let query = { date: { $gte: startDate, $lte: endDate } };
        if (routeId) query.routeId = routeId.toUpperCase();

        const analytics = await Analytics.find(query);

        const issues = [];
        analytics.forEach(day => {
            day.issues.forEach(issue => {
                if (severity && issue.severity !== severity) return;
                if (resolved !== undefined && issue.resolved !== (resolved === 'true')) return;
                
                issues.push({
                    ...issue.toObject(),
                    routeId: day.routeId,
                    date: day.date
                });
            });
        });

        // Sort by timestamp (newest first)
        issues.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            issues
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Resolve issue
exports.resolveIssue = async (req, res) => {
    try {
        const { analyticsId, issueId } = req.params;

        const analytics = await Analytics.findById(analyticsId);
        if (!analytics) {
            return res.status(404).json({ error: "Analytics not found" });
        }

        const issue = analytics.issues.id(issueId);
        if (!issue) {
            return res.status(404).json({ error: "Issue not found" });
        }

        issue.resolved = true;
        await analytics.save();

        res.json({
            success: true,
            message: "Issue resolved successfully"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};






