const express = require("express");

const {
    createTask,
    getProjectTasks,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createTask);

router.get(
    "/project/:projectId",
    authenticate,
    getProjectTasks
);

router.put(
    "/:taskId",
    authenticate,
    updateTask
);

router.delete(
    "/:taskId",
    authenticate,
    deleteTask
);

module.exports = router;