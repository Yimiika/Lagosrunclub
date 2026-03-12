const { User, Run } = require("../models"); // assuming Run model exists
const { Op } = require("sequelize");

/* =====================================================
   🔐 ADMIN CONTROLLERS
===================================================== */

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "first_name", "last_name", "email_address", "role", "profile_completed", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user role (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role.toLowerCase();
    await user.save();

    res.json({ message: "User role updated", user: { id: user.id, role: user.role } });
  } catch (err) {
    console.error("Error updating user role:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   👤 PUBLIC USER CONTROLLERS
===================================================== */

// Get public user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ["id", "first_name", "last_name", "email_address", "role", "profile_completed", "avatar_url"],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's runs
exports.getUserRuns = async (req, res) => {
  try {
    const { id } = req.params;

    const runs = await Run.findAll({
      where: { user_id: id },
      order: [["distance", "DESC"], ["duration", "ASC"]],
    });

    res.json({ runs });
  } catch (err) {
    console.error("Error fetching user runs:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user statistics (for leaderboard/personal stats)
exports.getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    const runs = await Run.findAll({
      where: { user_id: id },
    });

    if (!runs.length) return res.json({ stats: null, message: "No runs found" });

    // Calculate personal best
    const personalBest = runs.reduce((best, run) => {
      if (!best || run.duration < best.duration) return run;
      return best;
    }, null);

    // Aggregate stats
    const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const totalRuns = runs.length;
    const averageSpeed = runs.reduce((sum, run) => sum + run.distance / run.duration, 0) / totalRuns;

    res.json({
      stats: {
        totalRuns,
        totalDistance,
        averageSpeed: Number(averageSpeed.toFixed(2)),
        personalBest: {
          distance: personalBest.distance,
          duration: personalBest.duration,
          date: personalBest.createdAt,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};