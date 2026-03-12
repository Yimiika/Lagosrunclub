const jwt = require("jsonwebtoken");
const passport = require("passport");
const { addToBlacklist } = require("../middleware/blacklist");
const { users } = require("../models");
require("dotenv").config();

const JWT_EXPIRES_IN = "1h"; // Customize as needed

/* =====================================================
   🔹 SIGNUP
===================================================== */
exports.signup = (req, res, next) => {
  passport.authenticate("signup", { session: false }, (err, user, info) => {
    if (err) return res.status(500).json({ error: "Internal server error" });

    if (!user)
      return res.status(409).json({ error: info?.message || "Signup failed" });

    // Generate JWT
    const body = { id: user.id, role: user.role };
    const token = jwt.sign({ user: body }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(201).json({
      message: info.message,
      token,
      role: user.role,
      profile_completed: user.profile_completed,
    });
  })(req, res, next);
};

/* =====================================================
   🔹 LOGIN
===================================================== */
exports.login = (req, res, next) => {
  passport.authenticate("login", { session: false }, async (err, user, info) => {
    if (err) return res.status(500).json({ error: "Internal server error" });

    if (!user)
      return res.status(401).json({ error: info?.message || "Login failed" });

    // Generate JWT
    const body = { id: user.id, role: user.role };
    const token = jwt.sign({ user: body }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // If user has a Strava access token in DB, kick off a sync of runs
    try {
      const email_address = user.email_address || user.email;
      if (email_address) {
        const dbUser = await users.findOne({ where: { email_address } });
        if (dbUser && dbUser.strava_access_token) {
          const stravaController = require("./stravaController");
          try {
            await stravaController.syncStravaRuns(dbUser);
            console.log('Strava sync started for user:', dbUser.id);
          } catch (syncErr) {
            console.error('Strava sync error:', syncErr);
          }
        }
      }
    } catch (e) {
      console.error('Error checking Strava token:', e);
    }

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      profile_completed: user.profile_completed,
    });
  })(req, res, next);
};

/* =====================================================
   🔹 GOOGLE OAUTH CALLBACK
===================================================== */
exports.googleCallback = (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false, failureRedirect: "/" },
    (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.redirect("/?error=GoogleAuthFailed");

      // Generate JWT
      const body = { id: user.id, role: user.role };
      const token = jwt.sign({ user: body }, process.env.JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}?token=${token}`);
    }
  )(req, res, next);
};

/* =====================================================
   🔹 LOGOUT
===================================================== */
exports.logout = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(400).json({ message: "No token provided" });

  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp)
      return res.status(400).json({ message: "Invalid token" });

    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    addToBlacklist(token, expiresIn);

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error processing token" });
  }
};