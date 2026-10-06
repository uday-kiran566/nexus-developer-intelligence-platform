const pool = require("../db");

const createOrganization = async (req, res) => {
    let connection;

    try {
        const { name } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Organization name is required"
            });
        }

        const ownerId = req.user.userId;
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            "INSERT INTO organizations (name, owner_id) VALUES (?, ?)",
            [name.trim(), ownerId]
        );

        await connection.query(
            `INSERT INTO organization_members
            (organization_id, user_id, role)
            VALUES (?, ?, 'OWNER')`,
            [result.insertId, ownerId]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Organization created successfully",
            organization: {
                id: result.insertId,
                name: name.trim(),
                owner_id: ownerId
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("CREATE ORGANIZATION ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create organization"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getOrganizations = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [organizations] = await pool.query(
            `SELECT o.id, o.name, o.created_at, om.role
             FROM organizations o
             JOIN organization_members om
               ON o.id = om.organization_id
             WHERE om.user_id = ?
             ORDER BY o.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            organizations
        });

    } catch (error) {
        console.error("GET ORGANIZATIONS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load organizations"
        });
    }
};

module.exports = {
    createOrganization,
    getOrganizations
};