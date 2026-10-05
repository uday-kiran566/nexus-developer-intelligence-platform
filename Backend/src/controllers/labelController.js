const pool = require("../db");

// CREATE LABEL
const createLabel = async (req, res) => {
    try {
        const {
            project_id,
            name,
            color
        } = req.body;
        const userId = req.user.userId;

        if (!project_id || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project ID and label name are required"
            });
        }

        const [projects] = await pool.query(
            `SELECT p.organization_id
             FROM projects p
             JOIN project_members pm
               ON pm.project_id = p.id
             WHERE p.id = ?
               AND pm.user_id = ?`,
            [project_id, userId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found or access denied"
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
            message: "Failed to create label"
        });
    }
};


// GET PROJECT LABELS
const getProjectLabels = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.userId;

        const [projects] = await pool.query(
            `SELECT p.organization_id
             FROM projects p
             JOIN project_members pm
               ON pm.project_id = p.id
             WHERE p.id = ?
               AND pm.user_id = ?`,
            [projectId, userId]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found or access denied"
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
            message: "Failed to fetch labels"
        });
    }
};


// GET LABELS FOR TASK
const getTaskLabels = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.userId;

        const [labels] = await pool.query(
            `SELECT
                l.id,
                l.name,
                l.color
             FROM task_labels tl
             JOIN tasks t
                ON t.id = tl.task_id
             JOIN projects p
                ON p.id = t.project_id
             JOIN labels l
                ON l.id = tl.label_id
               AND l.organization_id = p.organization_id
             JOIN project_members pm
                ON pm.project_id = t.project_id
             WHERE tl.task_id = ?
               AND pm.user_id = ?
             ORDER BY l.name`,
            [taskId, userId]
        );

        res.json({
            success: true,
            labels
        });

    } catch (error) {
        console.error("GET TASK LABELS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch task labels"
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
        const userId = req.user.userId;

        if (!task_id || !label_id) {
            return res.status(400).json({
                success: false,
                message: "Task ID and label ID are required"
            });
        }
        const [authorizedLabels] = await pool.query(
            `SELECT t.id
             FROM tasks t
             JOIN projects p
               ON p.id = t.project_id
             JOIN project_members pm
               ON pm.project_id = p.id
             JOIN labels l
               ON l.organization_id = p.organization_id
             WHERE t.id = ?
               AND l.id = ?
               AND pm.user_id = ?`,
            [task_id, label_id, userId]
        );

        if (authorizedLabels.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task or label not found or access denied"
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
            message: "Failed to add label"
        });
    }
};


module.exports = {
    createLabel,
    getProjectLabels,
    getTaskLabels,
    addLabelToTask
};