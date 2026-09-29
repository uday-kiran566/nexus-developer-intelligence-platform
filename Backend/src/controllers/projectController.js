const pool = require("../db");

// CREATE PROJECT
const createProject = async (req, res) => {
    try {
        const {
            organization_id,
            name,
            description,
            status
        } = req.body;

        const userId = req.user.userId;

        if (!organization_id || !name) {
            return res.status(400).json({
                success: false,
                message: "Organization ID and project name are required"
            });
        }

        // Create project
        const [result] = await pool.query(
            `INSERT INTO projects
            (organization_id, name, description, status, created_by)
            VALUES (?, ?, ?, ?, ?)`,
            [
                organization_id,
                name.trim(),
                description || null,
                status || "PLANNING",
                userId
            ]
        );

        // Automatically add creator as project manager
        await pool.query(
            `INSERT INTO project_members
            (project_id, user_id, role)
            VALUES (?, ?, 'MANAGER')`,
            [result.insertId, userId]
        );

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project: {
                id: result.insertId,
                organization_id,
                name: name.trim(),
                description: description || null,
                status: status || "PLANNING",
                created_by: userId
            }
        });

    } catch (error) {
        console.error("CREATE PROJECT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create project",
            error: error.message
        });
    }
};


// GET PROJECTS FOR ORGANIZATION
const getProjects = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user.userId;

        const [projects] = await pool.query(
            `SELECT
                p.id,
                p.organization_id,
                p.team_id,
                p.name,
                p.description,
                p.status,
                p.created_by,
                p.created_at,
                p.updated_at
             FROM projects p
             INNER JOIN project_members pm
                ON p.id = pm.project_id
             WHERE p.organization_id = ?
               AND pm.user_id = ?
             ORDER BY p.created_at DESC`,
            [organizationId, userId]
        );

        res.json({
            success: true,
            projects
        });

    } catch (error) {
        console.error("GET PROJECTS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch projects",
            error: error.message
        });
    }
};


// GET SINGLE PROJECT
const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;

        const [projects] = await pool.query(
            `SELECT *
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

        res.json({
            success: true,
            project: projects[0]
        });

    } catch (error) {
        console.error("GET PROJECT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch project",
            error: error.message
        });
    }
};


// UPDATE PROJECT
const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, status } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Project name is required"
            });
        }

        const [result] = await pool.query(
            `UPDATE projects
             SET name = ?,
                 description = ?,
                 status = ?
             WHERE id = ?`,
            [
                name.trim(),
                description || null,
                status || "PLANNING",
                projectId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.json({
            success: true,
            message: "Project updated successfully"
        });

    } catch (error) {
        console.error("UPDATE PROJECT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update project",
            error: error.message
        });
    }
};


// DELETE PROJECT
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const [result] = await pool.query(
            "DELETE FROM projects WHERE id = ?",
            [projectId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.json({
            success: true,
            message: "Project deleted successfully"
        });

    } catch (error) {
        console.error("DELETE PROJECT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete project",
            error: error.message
        });
    }
};


module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
};