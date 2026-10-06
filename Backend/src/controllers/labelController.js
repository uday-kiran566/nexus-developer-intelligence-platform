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

        await pool.query(
            `DELETE FROM knowledge_chunks
             WHERE project_id = ?
               AND source_type = 'PROJECT'`,
            [project_id]
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
                l.id,
                l.organization_id,
                l.name,
                l.color,
                l.created_at
             FROM labels l
             WHERE l.organization_id = ?
               AND EXISTS (
                    SELECT 1
                    FROM projects p
                    JOIN project_members pm
                      ON pm.project_id = p.id
                    WHERE p.organization_id = l.organization_id
                      AND pm.user_id = ?
               )
             ORDER BY l.name`,
            [organizationId, userId]
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

        try {
            await pool.query(
                `INSERT INTO task_labels
                 (task_id, label_id)
                 VALUES (?, ?)`,
                [task_id, label_id]
            );
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    success: false,
                    message: "Label is already attached to this task"
                });
            }
            throw error;
        }

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

const removeLabelFromTask = async (req, res) => {
    try {
        const { taskId, labelId } = req.params;
        const userId = req.user.userId;

        const [authorizedLinks] = await pool.query(
            `SELECT tl.task_id
             FROM task_labels tl
             JOIN tasks t
               ON t.id = tl.task_id
             JOIN projects p
               ON p.id = t.project_id
             JOIN project_members pm
               ON pm.project_id = p.id
             JOIN labels l
               ON l.id = tl.label_id
              AND l.organization_id = p.organization_id
             WHERE tl.task_id = ?
               AND tl.label_id = ?
               AND pm.user_id = ?`,
            [taskId, labelId, userId]
        );

        if (authorizedLinks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task label not found or access denied"
            });
        }

        await pool.query(
            "DELETE FROM task_labels WHERE task_id = ? AND label_id = ?",
            [taskId, labelId]
        );

        res.json({
            success: true,
            message: "Label removed from task"
        });
    } catch (error) {
        console.error("REMOVE LABEL ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove label from task"
        });
    }
};

const updateLabel = async (req, res) => {
    try {
        const { labelId } = req.params;
        const { name, color } = req.body;
        const userId = req.user.userId;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Label name is required"
            });
        }

        const [labels] = await pool.query(
            `SELECT l.id
             FROM labels l
             JOIN organization_members om
               ON om.organization_id = l.organization_id
             WHERE l.id = ?
               AND om.user_id = ?
               AND om.role IN ('ADMIN', 'OWNER')`,
            [labelId, userId]
        );

        if (labels.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Label not found or access denied"
            });
        }

        await pool.query(
            `UPDATE labels
             SET name = ?, color = ?
             WHERE id = ?`,
            [name.trim(), color || "#6366f1", labelId]
        );

        res.json({
            success: true,
            message: "Label updated successfully"
        });
    } catch (error) {
        console.error("UPDATE LABEL ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update label"
        });
    }
};

const deleteLabel = async (req, res) => {
    let connection;

    try {
        const { labelId } = req.params;
        const userId = req.user.userId;
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [labels] = await connection.query(
            `SELECT l.id
             FROM labels l
             JOIN organization_members om
               ON om.organization_id = l.organization_id
             WHERE l.id = ?
               AND om.user_id = ?
               AND om.role IN ('ADMIN', 'OWNER')
             FOR UPDATE`,
            [labelId, userId]
        );

        if (labels.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Label not found or access denied"
            });
        }

        await connection.query(
            "DELETE FROM task_labels WHERE label_id = ?",
            [labelId]
        );
        await connection.query(
            "DELETE FROM labels WHERE id = ?",
            [labelId]
        );
        await connection.commit();

        res.json({
            success: true,
            message: "Label deleted successfully"
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("DELETE LABEL ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete label"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


module.exports = {
    createLabel,
    getProjectLabels,
    getTaskLabels,
    addLabelToTask,
    removeLabelFromTask,
    updateLabel,
    deleteLabel
};