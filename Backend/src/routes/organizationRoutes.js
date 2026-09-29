const express = require("express");

const {
    createOrganization,
    getOrganizations
} = require("../controllers/organizationController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createOrganization);

router.get("/", authenticate, getOrganizations);

module.exports = router;