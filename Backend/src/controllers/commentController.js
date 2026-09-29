const pool = require("../db");

const addComment = async (req, res) => {
    try {
        const { task_id, content } = req.body;

        if (!task_id || !content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task ID and comment are required"
            });
        }

        // Get task/project/organization information
        const [tasks] = await pool.query(
            `SELECT
                t.id,
                t.project_id,
                t.title,
                p.organization_id
             FROM tasks t
             JOIN projects p
                ON t.project_id = p.id
             WHERE t.id = ?`,
            [task_id]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const task = tasks[0];

        const [result] = await pool.query(
            `INSERT INTO comments
            (task_id, user_id, content)
            VALUES (?, ?, ?)`,
            [
                task_id,
                req.user.userId,
                content.trim()
            ]
        );

        // Activity
        await pool.query(
            `INSERT INTO activity_logs
            (user_id, organization_id, project_id, task_id, action, details)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.userId,
                task.organization_id,
                task.project_id,
                task_id,
                "COMMENT_ADDED",
                `A comment was added to task "${task.title}".`
            ]
        );

        // Notify assigned user if different from commenter
        const [assigned] = await pool.query(
            `SELECT assigned_to
             FROM tasks
             WHERE id = ?`,
            [task_id]
        );

        if (
            assigned.length > 0 &&
            assigned[0].assigned_to &&
            Number(assigned[0].assigned_to) !==
            Number(req.user.userId)
        ) {
            await pool.query(
                `INSERT INTO notifications
                (user_id, type, title, message)
                VALUES (?, ?, ?, ?)`,
                [
                    assigned[0].assigned_to,
                    "COMMENT",
                    "New task comment",
                    `A new comment was added to "${task.title}".`
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
            message: "Failed to add comment",
            error: error.message
        });
    }
};


const getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;

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


module.exports = {
    addComment,
    getTaskComments
};