const express = require("express");
const router = express.Router();
const upcomingRunsController = require("../controllers/upcomingRunsController");
const { requireAuth } = require("../authentication/auth");

// Create a run (admin or authorized user)
router.post("/", requireAuth, upcomingRunsController.createUpcomingRun);

// Register logged-in user for a run
router.post("/register", requireAuth, upcomingRunsController.registerForRun);

// Get all upcoming runs with registration info
router.get("/", requireAuth, upcomingRunsController.getUpcomingRuns);

module.exports = router;