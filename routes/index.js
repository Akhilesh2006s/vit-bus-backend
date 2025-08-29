const express = require("express");
const router = express.Router();

// Core routes
router.use("/gps", require("./gps"));
router.use("/stops", require("./stops"));

// Enhanced routes
router.use("/users", require("./users"));
router.use("/routes", require("./routes"));
router.use("/analytics", require("./analytics"));
router.use("/arrivals", require("./arrivals"));
router.use("/images", require("./images"));
router.use("/student-fees", require("./studentFees"));
router.use("/trackers", require("./trackers"));

// Legacy route-specific endpoints
router.use("/vv11", require("./vv11"));
router.use("/vv12", require("./vv12"));

module.exports = router;