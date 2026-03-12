const express = require("express");
const userController = require("../controllers/userController");
const { requireAuth, requireAdmin, requireCompletedProfile } = require("../authentication/auth");

const userRouter = express.Router();

/* =====================================================
   🔐 ADMIN ROUTES
===================================================== */

// Get all users (Admin only)
userRouter.get(
  "/",
  requireAuth,       // Ensure JWT is valid
  requireAdmin,      // Ensure user is admin
  userController.getAllUsers
);

// Delete a user (Admin only)
userRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  userController.deleteUser
);

// Update a user's role (Admin only)
userRouter.put(
  "/role/:id",
  requireAuth,
  requireAdmin,
  userController.updateUserRole
);

/* =====================================================
   👤 PUBLIC USER ROUTES
===================================================== */

// Get public user profile (anyone can view)
userRouter.get("/:id", userController.getUserProfile);

// Get user's runs (require profile completed if logged in)
userRouter.get(
  "/:id/runs",
  requireAuth,
  requireCompletedProfile,
  userController.getUserRuns
);

// Get user statistics (leaderboard / personal stats)
// userRouter.get(
//   "/:id/stats",
//   requireAuth,
//   requireCompletedProfile,
//   userController.getUserStats
// );

module.exports = userRouter;