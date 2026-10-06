const express = require("express");

const {
    addComment,
    getTaskComments,
    updateComment,
    deleteComment
} = require("../controllers/commentController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, addComment);

router.get(
    "/task/:taskId",
    authenticate,
    getTaskComments
);

router.put("/:commentId", authenticate, updateComment);
router.delete("/:commentId", authenticate, deleteComment);

module.exports = router;