const express = require("express");

const {
    createLabel,
    getProjectLabels,
    getTaskLabels,
    addLabelToTask,
    removeLabelFromTask,
    updateLabel,
    deleteLabel
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

router.delete(
    "/task/:taskId/:labelId",
    authenticate,
    removeLabelFromTask
);

router.put("/:labelId", authenticate, updateLabel);
router.delete("/:labelId", authenticate, deleteLabel);

module.exports = router;