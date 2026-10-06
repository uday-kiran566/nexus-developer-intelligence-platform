const pool = require("../db");

// CREATE PROJECT
const createProject = async (req, res) => {
    let connection;

    try {
        const {
            organization_id,
            name,
            description,
            status
        } = req.body;

        const userId = req.user.userId;

        if (!organization_id || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Organization ID and project name are required"
            });
        }

        const projectStatus = status || "PLANNING";
        if (!["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"].includes(projectStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project status"
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [members] = await connection.query(
            `SELECT id
             FROM organization_members
             WHERE organization_id = ?
               AND user_id = ?
             FOR UPDATE`,
            [organization_id, userId]
        );

        if (members.length === 0) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: "You do not have access to this organization"
            });
        }

        const [result] = await connection.query(
            `INSERT INTO projects
            (organization_id, name, description, status, created_by)
            VALUES (?, ?, ?, ?, ?)`,
            [
                organization_id,
                name.trim(),
                description || null,
                projectStatus,
                userId
            ]
        );

        // Creator becomes project manager
        await connection.query(
            `INSERT INTO project_members
            (project_id, user_id, role)
            VALUES (?, ?, 'MANAGER')`,
            [result.insertId, userId]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project: {
                id: result.insertId,
                organization_id,
                name: name.trim(),
                description: description || null,
                status: projectStatus,
                created_by: userId
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("CREATE PROJECT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create project"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// GET ALL PROJECTS ACCESSIBLE TO LOGGED-IN USER
const getMyProjects = async (req, res) => {
    try {
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
                p.updated_at,
                pm.role
             FROM projects p
             INNER JOIN project_members pm
                ON p.id = pm.project_id
             WHERE pm.user_id = ?
             ORDER BY p.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            projects
        });

    } catch (error) {
        console.error("GET MY PROJECTS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your projects"
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
             INNER JOIN organization_members om
                ON om.organization_id = p.organization_id
             WHERE p.organization_id = ?
               AND pm.user_id = ?
               AND om.user_id = ?
             ORDER BY p.created_at DESC`,
            [organizationId, userId, userId]
        );

        res.json({
            success: true,
            projects
        });

    } catch (error) {
        console.error("GET PROJECTS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch projects"
        });
    }
};


// GET SINGLE PROJECT
const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
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

        res.json({
            success: true,
            project: projects[0]
        });

    } catch (error) {
        console.error("GET PROJECT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch project"
        });
    }
};


// UPDATE PROJECT
const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, status } = req.body;
        const userId = req.user.userId;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project name is required"
            });
        }

        const projectStatus = status || "PLANNING";
        if (!["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"].includes(projectStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project status"
            });
        }

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

        const [result] = await pool.query(
            `UPDATE projects
             SET name = ?,
                 description = ?,
                 status = ?
             WHERE id = ?`,
            [
                name.trim(),
                description || null,
                projectStatus,
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
            message: "Failed to update project"
        });
    }
};


// DELETE PROJECT
const deleteProject = async (req, res) => {
    let connection;

    try {
        const { projectId } = req.params;
        const userId = req.user.userId;
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [members] = await connection.query(
            `SELECT p.id
             FROM projects p
             INNER JOIN project_members pm
                ON p.id = pm.project_id
             WHERE p.id = ?
               AND pm.user_id = ?
             FOR UPDATE`,
            [projectId, userId]
        );

        if (members.length === 0) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project"
            });
        }

        await connection.query(
            "DELETE FROM knowledge_chunks WHERE project_id = ?",
            [projectId]
        );

        const [result] = await connection.query(
            "DELETE FROM projects WHERE id = ?",
            [projectId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Project deleted successfully"
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("DELETE PROJECT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete project"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


module.exports = {
    createProject,
    getMyProjects,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
};