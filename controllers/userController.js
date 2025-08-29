const User = require("../models/User");

// Create or update user
exports.createOrUpdateUser = async (req, res) => {
    try {
        const { email, displayName, photoURL, firebaseUid, role = 'faculty' } = req.body;

        if (!email || !displayName || !firebaseUid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if user exists
        let user = await User.findOne({ firebaseUid });

        if (user) {
            // Update existing user
            user.email = email;
            user.displayName = displayName;
            user.photoURL = photoURL;
            user.role = role;
            user.lastLogin = new Date();
            await user.save();
        } else {
            // Create new user
            user = new User({
                email,
                displayName,
                photoURL,
                firebaseUid,
                role
            });
            await user.save();
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: user.role,
                selectedRoute: user.selectedRoute,
                preferences: user.preferences
            }
        });
    } catch (err) {
        console.error('User creation/update error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get user by Firebase UID
exports.getUserByFirebaseUid = async (req, res) => {
    try {
        const { firebaseUid } = req.params;
        const user = await User.findOne({ firebaseUid });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: user.role,
                selectedRoute: user.selectedRoute,
                preferences: user.preferences,
                lastLogin: user.lastLogin
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update user preferences
exports.updateUserPreferences = async (req, res) => {
    try {
        const { firebaseUid } = req.params;
        const { preferences, selectedRoute } = req.body;

        const user = await User.findOne({ firebaseUid });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }

        if (selectedRoute !== undefined) {
            user.selectedRoute = selectedRoute;
        }

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: user.role,
                selectedRoute: user.selectedRoute,
                preferences: user.preferences
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, { 
            email: 1, 
            displayName: 1, 
            role: 1, 
            lastLogin: 1, 
            createdAt: 1 
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            users
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

