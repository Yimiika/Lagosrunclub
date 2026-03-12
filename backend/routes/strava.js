const express = require("express");
const stravaController = require("../controllers/stravaController");
const { requireAuth } = require("../authentication/auth");

const router = express.Router();

router.get("/connect", requireAuth, stravaController.connectStrava);
router.get("/callback", stravaController.stravaCallback);
router.post("/disconnect", requireAuth, stravaController.disconnectStrava);

module.exports = router;