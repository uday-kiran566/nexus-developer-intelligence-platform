const express = require("express");

const {
    addDependency,
    getDependencies
} = require("../controllers/dependencyController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticate,
    addDependency
);

router.get(
    "/task/:taskId",
    authenticate,
    getDependencies
);

module.exports = router;