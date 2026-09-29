const express = require("express");

const {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
} = require("../controllers/projectController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createProject);

router.get(
    "/organization/:organizationId",
    authenticate,
    getProjects
);

router.get(
    "/:projectId",
    authenticate,
    getProjectById
);

router.put(
    "/:projectId",
    authenticate,
    updateProject
);

router.delete(
    "/:projectId",
    authenticate,
    deleteProject
);

module.exports = router;