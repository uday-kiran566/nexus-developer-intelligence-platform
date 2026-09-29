const pool = require("../db");

const createOrganization = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Organization name is required"
            });
        }

        const [result] = await pool.query(
            "INSERT INTO organizations (name) VALUES (?)",
            [name]
        );

        const organizationId = result.insertId;

        await pool.query(
            `INSERT INTO organization_members
            (organization_id, user_id, role)
            VALUES (?, ?, 'ADMIN')`,
            [organizationId, req.user.userId]
        );

        res.status(201).json({
            success: true,
            message: "Organization created successfully",
            organization: {
                id: organizationId,
                name
            }
        });

    } catch (error) {
        console.error("CREATE ORGANIZATION ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create organization"
        });
    }
};

const getOrganizations = async (req, res) => {
    try {
        const [organizations] = await pool.query(
            `SELECT o.id, o.name, om.role, o.created_at
             FROM organizations o
             JOIN organization_members om
             ON o.id = om.organization_id
             WHERE om.user_id = ?
             ORDER BY o.created_at DESC`,
            [req.user.userId]
        );

        res.json({
            success: true,
            organizations
        });

    } catch (error) {
        console.error("GET ORGANIZATIONS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch organizations"
        });
    }
};

module.exports = {
    createOrganization,
    getOrganizations
};