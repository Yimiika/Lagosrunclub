const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");

const authRouter = express.Router();

// Signup
authRouter.post("/signup", authController.signup);

// Login
authRouter.post("/login", authController.login);

// Logout
authRouter.post("/logout", authController.logout);

// Google OAuth
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);


// Google OAuth callback
authRouter.get("/google/callback", authController.googleCallback);

module.exports = authRouter;