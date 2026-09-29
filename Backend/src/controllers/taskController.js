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

        if (!project_id || !title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project ID and title are required"
            });
        }

        // Get organization for activity logging
        const [projects] = await pool.query(
            `SELECT organization_id
             FROM projects
             WHERE id = ?`,
            [project_id]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const organizationId = projects[0].organization_id;

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
                req.user.userId,
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
            message: "Failed to create task",
            error: error.message
        });
    }
};


// GET TASKS
const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;

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
            message: "Failed to fetch tasks",
            error: error.message
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

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required"
            });
        }

        // Get existing task
        const [existingTasks] = await pool.query(
            `SELECT
                id,
                project_id,
                assigned_to,
                title,
                status,
                priority
             FROM tasks
             WHERE id = ?`,
            [taskId]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const oldTask = existingTasks[0];

        // Get organization
        const [projects] = await pool.query(
            `SELECT organization_id
             FROM projects
             WHERE id = ?`,
            [oldTask.project_id]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const organizationId = projects[0].organization_id;

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
                req.user.userId,
                organizationId,
                oldTask.project_id,
                taskId,
                action,
                details
            ]
        );

        // Notify assigned user when task status changes
        if (
            assigned_to &&
            oldTask.status !== newStatus
        ) {
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
            message: "Failed to update task",
            error: error.message
        });
    }
};


// DELETE TASK
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        // Get task before deleting it
        const [tasks] = await pool.query(
            `SELECT
                id,
                project_id,
                title,
                assigned_to
             FROM tasks
             WHERE id = ?`,
            [taskId]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const task = tasks[0];

        // Get organization
        const [projects] = await pool.query(
            `SELECT organization_id
             FROM projects
             WHERE id = ?`,
            [task.project_id]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const organizationId = projects[0].organization_id;

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
                req.user.userId,
                organizationId,
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
            message: "Failed to delete task",
            error: error.message
        });
    }
};


module.exports = {
    createTask,
    getProjectTasks,
    updateTask,
    deleteTask
};