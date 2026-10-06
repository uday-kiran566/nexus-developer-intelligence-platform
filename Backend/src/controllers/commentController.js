const pool = require("../db");

const addComment = async (req, res) => {
    try {
        const { task_id, content } = req.body;

        if (!task_id || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task ID and comment are required"
            });
        }

        const userId = req.user.userId;

        const [authorizedTasks] = await pool.query(
            `SELECT
                t.id,
                t.project_id,
                t.title,
                t.assigned_to,
                p.organization_id
             FROM tasks t
             JOIN projects p
                ON t.project_id = p.id
             JOIN project_members pm
                ON pm.project_id = p.id
             WHERE t.id = ?
               AND pm.user_id = ?`,
            [task_id, userId]
        );

        if (authorizedTasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found or access denied"
            });
        }

        const task = authorizedTasks[0];

        const [result] = await pool.query(
            `INSERT INTO comments
            (task_id, user_id, content)
            VALUES (?, ?, ?)`,
            [
                task_id,
                userId,
                content.trim()
            ]
        );

        await pool.query(
            `DELETE FROM knowledge_chunks
             WHERE source_type = 'TASK'
               AND source_id = ?
               AND project_id = ?`,
            [task.id, task.project_id]
        );

        // Activity
        await pool.query(
            `INSERT INTO activity_logs
            (user_id, organization_id, project_id, task_id, action, details)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                task.organization_id,
                task.project_id,
                task_id,
                "COMMENT_ADDED",
                `A comment was added to task "${task.title}".`
            ]
        );

        // Notify assigned user if different from commenter
        if (
            task.assigned_to &&
            Number(task.assigned_to) !== Number(userId)
        ) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message)
                 SELECT ?, ?, ?, ?
                 WHERE EXISTS (
                    SELECT 1
                    FROM project_members
                    WHERE project_id = ?
                      AND user_id = ?
                 )`,
                [
                    task.assigned_to,
                    "COMMENT",
                    "New task comment",
                    `A new comment was added to "${task.title}".`,
                    task.project_id,
                    task.assigned_to
                ]
            );
        }

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            commentId: result.insertId
        });

    } catch (error) {
        console.error("ADD COMMENT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add comment"
        });
    }
};


const getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.userId;

        const [accessibleTasks] = await pool.query(
            `SELECT t.id
             FROM tasks t
             JOIN project_members pm
               ON pm.project_id = t.project_id
             WHERE t.id = ?
               AND pm.user_id = ?`,
            [taskId, userId]
        );

        if (accessibleTasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found or access denied"
            });
        }

        const [comments] = await pool.query(
            `SELECT
                c.id,
                c.content,
                c.created_at,
                u.id AS user_id,
                u.name AS user_name
             FROM comments c
             JOIN users u
                ON c.user_id = u.id
             WHERE c.task_id = ?
             ORDER BY c.created_at ASC`,
            [taskId]
        );

        res.json({
            success: true,
            comments
        });

    } catch (error) {
        console.error("GET COMMENTS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch comments"
        });
    }
};

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment content is required"
            });
        }

        const [comments] = await pool.query(
            `SELECT c.id, t.id AS task_id, t.project_id
             FROM comments c
             JOIN tasks t
               ON t.id = c.task_id
             JOIN project_members pm
               ON pm.project_id = t.project_id
             WHERE c.id = ?
               AND c.user_id = ?
               AND pm.user_id = ?`,
            [commentId, userId, userId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or access denied"
            });
        }

        await pool.query(
            "UPDATE comments SET content = ? WHERE id = ? AND user_id = ?",
            [content.trim(), commentId, userId]
        );
        await pool.query(
            `DELETE FROM knowledge_chunks
             WHERE source_type = 'TASK'
               AND source_id = ?
               AND project_id = ?`,
            [comments[0].task_id, comments[0].project_id]
        );

        res.json({
            success: true,
            message: "Comment updated successfully"
        });
    } catch (error) {
        console.error("UPDATE COMMENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update comment"
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;

        const [comments] = await pool.query(
            `SELECT c.id, t.id AS task_id, t.project_id
             FROM comments c
             JOIN tasks t
               ON t.id = c.task_id
             JOIN project_members pm
               ON pm.project_id = t.project_id
             WHERE c.id = ?
               AND c.user_id = ?
               AND pm.user_id = ?`,
            [commentId, userId, userId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or access denied"
            });
        }

        await pool.query(
            "DELETE FROM comments WHERE id = ? AND user_id = ?",
            [commentId, userId]
        );
        await pool.query(
            `DELETE FROM knowledge_chunks
             WHERE source_type = 'TASK'
               AND source_id = ?
               AND project_id = ?`,
            [comments[0].task_id, comments[0].project_id]
        );

        res.json({
            success: true,
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("DELETE COMMENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete comment"
        });
    }
};


module.exports = {
    addComment,
    getTaskComments,
    updateComment,
    deleteComment
};