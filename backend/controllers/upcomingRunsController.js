const { upcomingRuns, users } = require("../models");

/* ====================================
   CREATE AN UPCOMING RUN
==================================== */
exports.createUpcomingRun = async (req, res) => {
  try {
    const { title, date, distance, start_point, end_point, location } = req.body;

    if (!title || !date || !distance || !start_point || !end_point || !location) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const run = await upcomingRuns.create({
      title,
      date,
      distance,
      start_point,
      end_point,
      location,
    });

    return res.json({ message: "Upcoming run created successfully.", run });
  } catch (error) {
    console.error("Create Upcoming Run Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* ====================================
   REGISTER USER FOR A RUN
==================================== */
exports.registerForRun = async (req, res) => {
  try {
    const userId = req.user.id;
    const { runId } = req.body;

    const run = await upcomingRuns.findByPk(runId);
    if (!run) return res.status(404).json({ message: "Run not found." });

    // Check if user already registered
    const existing = await run.hasUser(userId);
    if (existing) return res.status(400).json({ message: "Already registered." });

    await run.addUser(userId);

    return res.json({ message: "Registered for run successfully." });
  } catch (error) {
    console.error("Register For Run Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* ====================================
   GET ALL UPCOMING RUNS WITH REGISTRATION INFO
==================================== */
exports.getUpcomingRuns = async (req, res) => {
  try {
    const runs = await upcomingRuns.findAll({
      include: [
        {
          model: users,
          attributes: ["id", "username"],
          through: { attributes: [] },
        },
      ],
      order: [["date", "ASC"]],
    });

    const formatted = runs.map((r) => ({
      id: r.id,
      title: r.title,
      date: r.date,
      distance: r.distance,
      start_point: r.start_point,
      end_point: r.end_point,
      location: r.location,
      registered_count: r.users.length,
      registered_users: r.users.map(u => u.username),
    }));

    return res.json({ upcoming_runs: formatted });
  } catch (error) {
    console.error("Get Upcoming Runs Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};