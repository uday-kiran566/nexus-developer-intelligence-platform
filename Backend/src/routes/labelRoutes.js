const express = require("express");

const {
    createLabel,
    getProjectLabels,
    getTaskLabels,
    addLabelToTask
} = require("../controllers/labelController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticate,
    createLabel
);

router.get(
    "/project/:projectId",
    authenticate,
    getProjectLabels
);

router.get(
    "/task/:taskId",
    authenticate,
    getTaskLabels
);

router.post(
    "/task",
    authenticate,
    addLabelToTask
);

module.exports = router;