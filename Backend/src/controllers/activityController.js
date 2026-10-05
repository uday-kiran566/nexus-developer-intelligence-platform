const pool = require("../db");

const getActivityLogs = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user.userId;

        // Verify that the logged-in user belongs to this organization
        const [members] = await pool.query(
            `SELECT id
             FROM organization_members
             WHERE organization_id = ?
               AND user_id = ?`,
            [organizationId, userId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this organization"
            });
        }

        // Only return activity from an organization
        // the logged-in user belongs to
        const [logs] = await pool.query(
            `SELECT
                a.*,
                u.name AS user_name
             FROM activity_logs a
             LEFT JOIN users u
                ON a.user_id = u.id
             WHERE a.organization_id = ?
             ORDER BY a.created_at DESC
             LIMIT 100`,
            [organizationId]
        );

        res.json({
            success: true,
            logs
        });

    } catch (error) {
        console.error("GET ACTIVITY ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch activity logs"
        });
    }
};

module.exports = {
    getActivityLogs
};