const pool = require("../db");

// ADD DEPENDENCY
const addDependency = async (req, res) => {
    try {
        const {
            task_id,
            depends_on_task_id
        } = req.body;
        const userId = req.user.userId;

        if (!task_id || !depends_on_task_id) {
            return res.status(400).json({
                success: false,
                message: "Both task IDs are required"
            });
        }

        if (Number(task_id) === Number(depends_on_task_id)) {
            return res.status(400).json({
                success: false,
                message: "A task cannot depend on itself"
            });
        }

        const [tasks] = await pool.query(
            `SELECT t.id, t.project_id
             FROM tasks t
             JOIN project_members pm
               ON pm.project_id = t.project_id
             WHERE t.id IN (?, ?)
               AND pm.user_id = ?`,
            [task_id, depends_on_task_id, userId]
        );

        if (tasks.length !== 2) {
            return res.status(404).json({
                success: false,
                message: "One or both tasks were not found or access denied"
            });
        }

        if (Number(tasks[0].project_id) !== Number(tasks[1].project_id)) {
            return res.status(400).json({
                success: false,
                message: "Dependencies must be between tasks in the same project"
            });
        }

        // Check for existing dependency
        const [existing] = await pool.query(
            `SELECT id
             FROM task_dependencies
             WHERE task_id = ?
               AND depends_on_task_id = ?`,
            [task_id, depends_on_task_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This dependency already exists"
            });
        }

        await pool.query(
            `INSERT INTO task_dependencies
             (task_id, depends_on_task_id)
             VALUES (?, ?)`,
            [task_id, depends_on_task_id]
        );

        res.status(201).json({
            success: true,
            message: "Dependency created successfully"
        });

    } catch (error) {
        console.error("DEPENDENCY ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create dependency"
        });
    }
};


// GET DEPENDENCIES
const getDependencies = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.userId;

        const [dependencies] = await pool.query(
            `SELECT
                td.id,
                td.task_id,
                td.depends_on_task_id,
                t.title AS depends_on_title
             FROM task_dependencies td
             JOIN tasks t
                ON td.depends_on_task_id = t.id
             JOIN tasks source_task
                ON source_task.id = td.task_id
               AND source_task.project_id = t.project_id
             JOIN project_members pm
                ON pm.project_id = source_task.project_id
             WHERE td.task_id = ?
               AND pm.user_id = ?
             ORDER BY td.id`,
            [taskId, userId]
        );

        res.json({
            success: true,
            dependencies
        });

    } catch (error) {
        console.error("GET DEPENDENCIES ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dependencies"
        });
    }
};


module.exports = {
    addDependency,
    getDependencies
};