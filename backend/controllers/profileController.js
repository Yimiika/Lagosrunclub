const { Op } = require("sequelize");
const { users } = require("../models");

/* =====================================================
   POST /user/profile/setup
   - Complete profile + upload avatar
===================================================== */
exports.completeProfileWithAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, location_area, bio } = req.body;

    // if (!username || !location_area) {
    //   return res
    //     .status(400)
    //     .json({ message: "Username and location_area are required." });
    // }

    // // Normalize username
    // const normalizedUsername = username.toLowerCase().trim();

    // Check if username is already taken
    // const existingUser = await users.findOne({
    //   where: { username: normalizedUsername, id: { [Op.ne]: userId } },
    // });

    // if (existingUser) {
    //   return res.status(409).json({ message: "Username already taken." });
    // }

    // Find user
    const user = await users.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Update profile fields
    // user.username = normalizedUsername;
    // user.location_area = location_area;
    // if (bio) user.bio = bio;

    // If avatar uploaded, save Cloudinary URL
    if (req.file && req.file.path) {
      user.profile_image_url = req.file.path;
    }

    user.profile_completed = true;

    await user.save();

    return res.json({
      message: "Profile completed successfully.",
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        location_area: user.location_area,
        bio: user.bio,
        profile_image_url: user.profile_image_url,
        profile_completed: user.profile_completed,
      },
    });
  } catch (error) {
    console.error("Profile Setup Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* =====================================================
   PATCH /user/profile/update
   - Low-level profile edits
===================================================== */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, location_area, bio, profile_image_url } = req.body;

    const user = await users.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Update username if provided
    if (username && username.toLowerCase().trim() !== user.username) {
      const normalizedUsername = username.toLowerCase().trim();
      const existingUser = await users.findOne({
        where: { username: normalizedUsername, id: { [Op.ne]: userId } },
      });
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken." });
      }
      user.username = normalizedUsername;
    }

    if (location_area) user.location_area = location_area;
    if (bio) user.bio = bio;
    if (profile_image_url) user.profile_image_url = profile_image_url;

    await user.save();

    return res.json({
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        location_area: user.location_area,
        bio: user.bio,
        profile_image_url: user.profile_image_url,
        profile_completed: user.profile_completed,
      },
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/* =====================================================
   POST /user/profile/upload-avatar
   - Upload profile image to Cloudinary separately
===================================================== */
exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    const user = await users.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.profile_image_url = req.file.path; // Cloudinary URL
    await user.save();

    return res.json({
      message: "Profile image uploaded successfully.",
      profile_image_url: user.profile_image_url,
    });
  } catch (error) {
    console.error("Profile Image Upload Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};