const pool = require("../db");

// CREATE TASK
const createTask = async (req, res) => {
    try {
        const {
            project_id,
            assigned_to,
            title,
            description,
            status,
            priority,
            due_date
        } = req.body;

        const userId = req.user.userId;

        if (!project_id || !title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project ID and title are required"
            });
        }

        // Check whether logged-in user is a member of the project
        const [members] = await pool.query(
            `SELECT p.organization_id
             FROM projects p
             INNER JOIN project_members pm
                ON p.id = pm.project_id
             WHERE p.id = ?
               AND pm.user_id = ?`,
            [project_id, userId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project"
            });
        }

        if (assigned_to) {
            const [assignees] = await pool.query(
                `SELECT id
                 FROM project_members
                 WHERE project_id = ?
                   AND user_id = ?`,
                [project_id, assigned_to]
            );

            if (assignees.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Assignee must be a member of this project"
                });
            }
        }

        const organizationId = members[0].organization_id;

        const taskStatus = status || "TODO";
        const taskPriority = priority || "MEDIUM";

        const [result] = await pool.query(
            `INSERT INTO tasks
            (project_id, assigned_to, title, description, status, priority, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                project_id,
                assigned_to || null,
                title.trim(),
                description || null,
                taskStatus,
                taskPriority,
                due_date || null
            ]
        );

        const taskId = result.insertId;

        // ACTIVITY LOG
        await pool.query(
            `INSERT INTO activity_logs
            (user_id, organization_id, project_id, task_id, action, details)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                organizationId,
                project_id,
                taskId,
                "TASK_CREATED",
                `Task "${title.trim()}" was created with ${taskPriority} priority.`
            ]
        );

        // NOTIFICATION FOR ASSIGNED USER
        if (assigned_to) {
            await pool.query(
                `INSERT INTO notifications
                (user_id, type, title, message)
                VALUES (?, ?, ?, ?)`,
                [
                    assigned_to,
                    "TASK",
                    "New task assigned",
                    `You were assigned the task "${title.trim()}".`
                ]
            );
        }

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            taskId
        });

    } catch (error) {
        console.error("CREATE TASK ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create task"
        });
    }
};


// GET TASKS FOR PROJECT
const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.userId;

        // Verify project membership
        const [members] = await pool.query(
            `SELECT id
             FROM project_members
             WHERE project_id = ?
               AND user_id = ?`,
            [projectId, userId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project"
            });
        }

        const [tasks] = await pool.query(
            `SELECT
                t.id,
                t.project_id,
                t.assigned_to,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.due_date,
                t.created_at,
                t.updated_at,
                u.name AS assigned_user
             FROM tasks t
             LEFT JOIN users u
                ON t.assigned_to = u.id
             WHERE t.project_id = ?
             ORDER BY t.created_at DESC`,
            [projectId]
        );

        res.json({
            success: true,
            tasks
        });

    } catch (error) {
        console.error("GET TASKS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks"
        });
    }
};


// UPDATE TASK
const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const {
            title,
            description,
            status,
            priority,
            assigned_to,
            due_date
        } = req.body;

        const userId = req.user.userId;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required"
            });
        }

        // Get task and verify project membership
        const [existingTasks] = await pool.query(
            `SELECT
                t.id,
                t.project_id,
                t.assigned_to,
                t.title,
                t.status,
                t.priority,
                p.organization_id
             FROM tasks t
             INNER JOIN projects p
                ON t.project_id = p.id
             INNER JOIN project_members pm
                ON p.id = pm.project_id
             WHERE t.id = ?
               AND pm.user_id = ?`,
            [taskId, userId]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found or access denied"
            });
        }

        const oldTask = existingTasks[0];

        if (assigned_to) {
            const [assignees] = await pool.query(
                `SELECT id
                 FROM project_members
                 WHERE project_id = ?
                   AND user_id = ?`,
                [oldTask.project_id, assigned_to]
            );

            if (assignees.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Assignee must be a member of this project"
                });
            }
        }

        const newStatus = status || "TODO";
        const newPriority = priority || "MEDIUM";

        await pool.query(
            `UPDATE tasks
             SET title = ?,
                 description = ?,
                 status = ?,
                 priority = ?,
                 assigned_to = ?,
                 due_date = ?
             WHERE id = ?`,
            [
                title.trim(),
                description || null,
                newStatus,
                newPriority,
                assigned_to || null,
                due_date || null,
                taskId
            ]
        );

        // Determine activity message
        let action = "TASK_UPDATED";
        let details = `Task "${title.trim()}" was updated.`;

        if (oldTask.status !== newStatus) {
            action = "TASK_STATUS_CHANGED";
            details = `Task "${title.trim()}" moved from ${oldTask.status} to ${newStatus}.`;
        } else if (oldTask.priority !== newPriority) {
            action = "TASK_PRIORITY_CHANGED";
            details = `Task "${title.trim()}" priority changed from ${oldTask.priority} to ${newPriority}.`;
        }

        // ACTIVITY LOG
        await pool.query(
            `INSERT INTO activity_logs
            (user_id, organization_id, project_id, task_id, action, details)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                oldTask.organization_id,
                oldTask.project_id,
                taskId,
                action,
                details
            ]
        );

        // Notify assigned user when task status changes
        if (assigned_to && oldTask.status !== newStatus) {
            await pool.query(
                `INSERT INTO notifications
                (user_id, type, title, message)
                VALUES (?, ?, ?, ?)`,
                [
                    assigned_to,
                    "TASK",
                    "Task status updated",
                    `Task "${title.trim()}" moved to ${newStatus}.`
                ]
            );
        }

        res.json({
            success: true,
            message: "Task updated successfully"
        });

    } catch (error) {
        console.error("UPDATE TASK ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update task"
        });
    }
};


// DELETE TASK
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.userId;

        // Get task and verify project membership
        const [tasks] = await pool.query(
            `SELECT
                t.id,
                t.project_id,
                t.title,
                t.assigned_to,
                p.organization_id
             FROM tasks t
             INNER JOIN projects p
                ON t.project_id = p.id
             INNER JOIN project_members pm
                ON p.id = pm.project_id
             WHERE t.id = ?
               AND pm.user_id = ?`,
            [taskId, userId]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found or access denied"
            });
        }

        const task = tasks[0];

        // Delete task
        await pool.query(
            "DELETE FROM tasks WHERE id = ?",
            [taskId]
        );

        // ACTIVITY LOG
        await pool.query(
            `INSERT INTO activity_logs
            (user_id, organization_id, project_id, task_id, action, details)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                task.organization_id,
                task.project_id,
                taskId,
                "TASK_DELETED",
                `Task "${task.title}" was deleted.`
            ]
        );

        res.json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("DELETE TASK ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete task"
        });
    }
};


module.exports = {
    createTask,
    getProjectTasks,
    updateTask,
    deleteTask
};