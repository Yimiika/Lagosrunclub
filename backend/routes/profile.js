const express = require("express");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const profileController = require("../controllers/profileController");
const { requireAuth } = require("../authentication/auth");

const upload = multer({ storage });
const profileRouter = express.Router();

// Complete profile + upload avatar in one request
profileRouter.post(
  "/setup",
  requireAuth,
  upload.single("profile_image"), // Accepts avatar
  profileController.completeProfileWithAvatar
);

// Low-level profile edits (optional updates)
profileRouter.patch(
  "/update",
  requireAuth,
  profileController.updateProfile
);

// Upload profile image separately (optional)
profileRouter.post(
  "/upload-avatar",
  requireAuth,
  upload.single("profile_image"),
  profileController.uploadProfileImage
);

module.exports = profileRouter;