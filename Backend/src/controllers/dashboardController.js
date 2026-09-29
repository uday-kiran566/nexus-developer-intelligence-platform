const pool = require("../db");

const getDashboard = async (req, res) => {
    try {
        const [users] = await pool.query(
            "SELECT COUNT(*) AS total FROM users"
        );

        const [organizations] = await pool.query(
            "SELECT COUNT(*) AS total FROM organizations"
        );

        const [projects] = await pool.query(
            "SELECT COUNT(*) AS total FROM projects"
        );

        const [tasks] = await pool.query(
            "SELECT COUNT(*) AS total FROM tasks"
        );

        const [completedTasks] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM tasks
             WHERE status = 'DONE'`
        );

        const [inProgressTasks] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM tasks
             WHERE status = 'IN_PROGRESS'`
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
            message: "Failed to load dashboard"
        });
    }
};

module.exports = {
    getDashboard
};