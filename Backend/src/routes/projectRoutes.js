const express = require("express");

const {
    createProject,
    getMyProjects,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
} = require("../controllers/projectController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createProject);

// GET ONLY PROJECTS BELONGING TO LOGGED-IN USER
router.get(
    "/my",
    authenticate,
    getMyProjects
);

// GET PROJECTS FOR A SPECIFIC ORGANIZATION
router.get(
    "/organization/:organizationId",
    authenticate,
    getProjects
);

// GET SINGLE PROJECT
router.get(
    "/:projectId",
    authenticate,
    getProjectById
);

// UPDATE PROJECT
router.put(
    "/:projectId",
    authenticate,
    updateProject
);

// DELETE PROJECT
router.delete(
    "/:projectId",
    authenticate,
    deleteProject
);

module.exports = router;