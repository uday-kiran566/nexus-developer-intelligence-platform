const express = require("express");
const authenticate = require("../middleware/authMiddleware");

const {
    chat,
    indexProjectData
} = require("../controllers/aiController");

const router = express.Router();

// Index a project into the RAG knowledge store
router.post(
    "/index/:projectId",
    authenticate,
    indexProjectData
);

// Ask NEXUS AI using RAG context
router.post(
    "/chat",
    authenticate,
    chat
);

module.exports = router;