const express = require("express");

const {
    getActivityLogs
} = require("../controllers/activityController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/organization/:organizationId",
    authenticate,
    getActivityLogs
);

module.exports = router;