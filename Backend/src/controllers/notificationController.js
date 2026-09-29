const pool = require("../db");

const getNotifications = async (req, res) => {
    try {
        const [notifications] = await pool.query(
            `SELECT *
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [req.user.userId]
        );

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error("GET NOTIFICATIONS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE id = ? AND user_id = ?`,
            [notificationId, req.user.userId]
        );

        res.json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (error) {
        console.error("MARK NOTIFICATION ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update notification"
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead
};