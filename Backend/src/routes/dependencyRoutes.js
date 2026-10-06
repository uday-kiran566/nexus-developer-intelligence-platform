const express = require("express");

const {
    addDependency,
    getDependencies,
    deleteDependency
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

router.delete("/:dependencyId", authenticate, deleteDependency);

module.exports = router;