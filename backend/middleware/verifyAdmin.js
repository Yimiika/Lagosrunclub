const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins are authorized to access this resource.",
      });
    }

    next();
  } catch (err) {
    console.error("Error verifying admin:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = verifyAdmin;