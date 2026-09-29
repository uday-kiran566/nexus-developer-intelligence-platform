const express = require("express");

const {
    addComment,
    getTaskComments
} = require("../controllers/commentController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, addComment);

router.get(
    "/task/:taskId",
    authenticate,
    getTaskComments
);

module.exports = router;