const pool = require("../db");

// CREATE LABEL
const createLabel = async (req, res) => {
    try {
        const {
            project_id,
            name,
            color
        } = req.body;

        if (!project_id || !name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project ID and label name are required"
            });
        }

        // Find organization from project
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

        const [result] = await pool.query(
            `INSERT INTO labels
             (organization_id, name, color)
             VALUES (?, ?, ?)`,
            [
                organizationId,
                name.trim(),
                color || "#6366f1"
            ]
        );

        res.status(201).json({
            success: true,
            message: "Label created successfully",
            labelId: result.insertId
        });

    } catch (error) {
        console.error("CREATE LABEL ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create label",
            error: error.message
        });
    }
};


// GET PROJECT LABELS
const getProjectLabels = async (req, res) => {
    try {
        const { projectId } = req.params;

        const [projects] = await pool.query(
            `SELECT organization_id
             FROM projects
             WHERE id = ?`,
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const organizationId = projects[0].organization_id;

        const [labels] = await pool.query(
            `SELECT
                id,
                organization_id,
                name,
                color,
                created_at
             FROM labels
             WHERE organization_id = ?
             ORDER BY name`,
            [organizationId]
        );

        res.json({
            success: true,
            labels
        });

    } catch (error) {
        console.error("GET LABELS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch labels",
            error: error.message
        });
    }
};


// GET LABELS FOR TASK
const getTaskLabels = async (req, res) => {
    try {
        const { taskId } = req.params;

        const [labels] = await pool.query(
            `SELECT
                l.id,
                l.name,
                l.color
             FROM task_labels tl
             JOIN labels l
                ON tl.label_id = l.id
             WHERE tl.task_id = ?
             ORDER BY l.name`,
            [taskId]
        );

        res.json({
            success: true,
            labels
        });

    } catch (error) {
        console.error("GET TASK LABELS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch task labels",
            error: error.message
        });
    }
};


// ADD LABEL TO TASK
const addLabelToTask = async (req, res) => {
    try {
        const {
            task_id,
            label_id
        } = req.body;

        if (!task_id || !label_id) {
            return res.status(400).json({
                success: false,
                message: "Task ID and label ID are required"
            });
        }
        const [existing] = await pool.query(
            `SELECT task_id, label_id
            FROM task_labels
            WHERE task_id = ?
            AND label_id = ?`,
            [task_id, label_id]
        );
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Label is already attached to this task"
            });
        }

        await pool.query(
            `INSERT INTO task_labels
             (task_id, label_id)
             VALUES (?, ?)`,
            [task_id, label_id]
        );

        res.status(201).json({
            success: true,
            message: "Label added to task"
        });

    } catch (error) {
        console.error("ADD LABEL ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add label",
            error: error.message
        });
    }
};


module.exports = {
    createLabel,
    getProjectLabels,
    getTaskLabels,
    addLabelToTask
};