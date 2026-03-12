const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cors = require("cors");
require("dotenv").config();

const {
  passport,
  checkRevokedToken,
  optionalAuth,
} = require("./authentication/auth");

const authRoute = require("./routes/auth");
const usersRoute = require("./routes/users");
const profileRoute = require("./routes/profile");
const stravaRoute = require("./routes/strava");
const runsRoute = require("./routes/runs"); // For user runs, uploading, leaderboard

const app = express();

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(passport.initialize());

app.set("views", "views");
app.set("view engine", "ejs");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// =====================
// Routes
// =====================

// Authentication
app.use("/", authRoute);

// Users (Admin only)
app.use("/users", checkRevokedToken, usersRoute);

// Profile (for users to complete or edit profile)
app.use("/profile", checkRevokedToken, profileRoute);

// Strava (for connecting and syncing runs)
app.use("/strava", checkRevokedToken, stravaRoute);

// Runs (upload runs, view leaderboard, personal stats)
app.use("/runs", checkRevokedToken, runsRoute);

// Optional auth example: public leaderboard
// e.g., GET /runs/leaderboard
//app.use("/leaderboard", optionalAuth, runsRoute);

// =====================
// Global Error Handler
// =====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;