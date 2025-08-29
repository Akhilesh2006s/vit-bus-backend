const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// User management routes
router.post("/create-or-update", userController.createOrUpdateUser);
router.get("/:firebaseUid", userController.getUserByFirebaseUid);
router.put("/:firebaseUid/preferences", userController.updateUserPreferences);

// Admin routes
router.get("/", userController.getAllUsers);
router.delete("/:userId", userController.deleteUser);

module.exports = router;

