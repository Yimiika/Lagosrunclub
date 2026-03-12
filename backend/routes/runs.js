// routes/runRoutes.js
const express = require("express");
const router = express.Router();
const runController = require("../controllers/runController");
const { requireAuth } = require("../authentication/auth");
// ==========================
// Manual run creation
// ==========================
router.post("/manual", requireAuth, runController.createManualRun);

// ==========================
// Get all runs by the logged-in user
// ==========================
router.get("/user", requireAuth, runController.getAllRuns);

// ==========================
// Get personal best runs by the logged-in user
// ==========================
router.get("/personal-best", requireAuth, runController.getPersonalBest);

module.exports = router;