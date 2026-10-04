const pool = require("../db");

const getDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Total users
        // Only the logged-in user
        // const users = [{ total: 1 }];
        );

        // Organizations belonging to logged-in user
        const [organizations] = await pool.query(
            `SELECT COUNT(DISTINCT om.organization_id) AS total
             FROM organization_members om
             WHERE om.user_id = ?`,
            [userId]
        );

        // Projects belonging to logged-in user
        const [projects] = await pool.query(
            `SELECT COUNT(DISTINCT pm.project_id) AS total
             FROM project_members pm
             WHERE pm.user_id = ?`,
            [userId]
        );

        // Tasks inside user's projects
        const [tasks] = await pool.query(
            `SELECT COUNT(DISTINCT t.id) AS total
             FROM tasks t
             INNER JOIN project_members pm
                ON t.project_id = pm.project_id
             WHERE pm.user_id = ?`,
            [userId]
        );

        // Completed tasks inside user's projects
        const [completedTasks] = await pool.query(
            `SELECT COUNT(DISTINCT t.id) AS total
             FROM tasks t
             INNER JOIN project_members pm
                ON t.project_id = pm.project_id
             WHERE pm.user_id = ?
               AND t.status = 'DONE'`,
            [userId]
        );

        // In-progress tasks inside user's projects
        const [inProgressTasks] = await pool.query(
            `SELECT COUNT(DISTINCT t.id) AS total
             FROM tasks t
             INNER JOIN project_members pm
                ON t.project_id = pm.project_id
             WHERE pm.user_id = ?
               AND t.status = 'IN_PROGRESS'`,
            [userId]
        );

        res.json({
            success: true,
            dashboard: {
                totalUsers: users[0].total,
                totalOrganizations: organizations[0].total,
                totalProjects: projects[0].total,
                totalTasks: tasks[0].total,
                completedTasks: completedTasks[0].total,
                inProgressTasks: inProgressTasks[0].total
            }
        });

    } catch (error) {
        console.error("DASHBOARD ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load dashboard",
            error: error.message
        });
    }
};

module.exports = {
    getDashboard
};