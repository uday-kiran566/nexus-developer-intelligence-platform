const pool = require("../db");

// ADD DEPENDENCY
const addDependency = async (req, res) => {
    try {
        const {
            task_id,
            depends_on_task_id
        } = req.body;

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

        // Check that both tasks exist
        const [tasks] = await pool.query(
            `SELECT id
             FROM tasks
             WHERE id IN (?, ?)`,
            [task_id, depends_on_task_id]
        );

        if (tasks.length !== 2) {
            return res.status(404).json({
                success: false,
                message: "One or both tasks were not found"
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
            message: "Failed to create dependency",
            error: error.message
        });
    }
};


// GET DEPENDENCIES
const getDependencies = async (req, res) => {
    try {
        const { taskId } = req.params;

        const [dependencies] = await pool.query(
            `SELECT
                td.id,
                td.task_id,
                td.depends_on_task_id,
                t.title AS depends_on_title
             FROM task_dependencies td
             JOIN tasks t
                ON td.depends_on_task_id = t.id
             WHERE td.task_id = ?
             ORDER BY td.id`,
            [taskId]
        );

        res.json({
            success: true,
            dependencies
        });

    } catch (error) {
        console.error("GET DEPENDENCIES ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dependencies",
            error: error.message
        });
    }
};


module.exports = {
    addDependency,
    getDependencies
};