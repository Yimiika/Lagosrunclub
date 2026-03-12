// controllers/runsController.js
const { runs, users } = require("../models");
const { Op } = require("sequelize");

/* =====================================================
   POST /runs/manual
   - Create a manual run
===================================================== */
exports.createManualRun = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      distance,
      duration,
      elevation_gain,
      run_date,
      title,
    } = req.body;

    if (!distance || !duration || !run_date) {
      return res.status(400).json({ message: "distance, duration, and run_date are required." });
    }

    // Parse and validate
    const distanceKm = parseFloat(distance);
    const durationMin = parseFloat(duration);

    if (isNaN(distanceKm) || isNaN(durationMin)) {
      return res.status(400).json({ message: "distance and duration must be numbers." });
    }

    // Calculate average pace (min/km) and speed (km/h)
    const average_pace = distanceKm > 0 ? durationMin / distanceKm : null;
    const average_speed = distanceKm > 0 ? distanceKm / (durationMin / 60) : null;

    // Fetch all previous runs of this user
    const previousRuns = await runs.findAll({ where: { user_id: userId } });

    // Determine if this is a personal best (longest distance)
    let is_personal_best = false;
    if (previousRuns.length === 0) {
      is_personal_best = true; // first entry is automatically PB
    } else {
      const maxDistance = Math.max(...previousRuns.map(r => r.distance));
      if (distanceKm > maxDistance) {
        is_personal_best = true;
        // Reset previous personal best
        await runs.update({ is_personal_best: false }, {
          where: { user_id: userId, is_personal_best: true },
        });
      }
    }

    const run = await runs.create({
      user_id: userId,
      distance: distanceKm,
      duration: durationMin,
      average_pace,
      average_speed,
      elevation_gain: elevation_gain || null,
      run_date,
      title: title || null,
      source: "manual",
      is_personal_best,
    });

    return res.json({
      message: "Run added successfully.",
      run,
    });
  } catch (error) {
    console.error("Create Manual Run Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* =====================================================
   GET /runs
   - Get all runs for the authenticated user
===================================================== */
exports.getAllRuns = async (req, res) => {
  try {
    const userId = req.user.id;
    const runs = await runs.findAll({
      where: { user_id: userId },
      order: [["run_date", "DESC"]],
    });
    return res.json({ runs });
  } catch (error) {
    console.error("Get All Runs Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* =====================================================
   GET /runs/personal-best
   - Get the personal best run for the authenticated user
===================================================== */
exports.getPersonalBest = async (req, res) => {
  try {
    const userId = req.user.id;
    const pbRun = await runs.findOne({
      where: { user_id: userId, is_personal_best: true },
    });
    if (!pbRun) return res.status(404).json({ message: "No personal best found." });

    return res.json({ personal_best: pbRun });
  } catch (error) {
    console.error("Get Personal Best Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};