const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const taskRoutes = require("./routes/taskRoutes");
const projectRoutes = require("./routes/projectRoutes");
const teamRoutes = require("./routes/teamRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const labelRoutes = require("./routes/labelRoutes");
const dependencyRoutes = require("./routes/dependencyRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/labels", labelRoutes);
app.use("/api/dependencies", dependencyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "NEXUS API is running 🚀"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS connected");

        res.json({
            success: true,
            message: "MySQL connected successfully",
            result: rows
        });
    } catch (error) {
        console.error("DATABASE ERROR:", error);

        res.status(500).json({
            success: false,
            message: "MySQL connection failed"
        });
    }
});

app.use((error, req, res, next) => {
    console.error("UNHANDLED API ERROR:", error);

    if (res.headersSent) {
        return next(error);
    }

    const status = error.status === 400 ? 400 : 500;
    return res.status(status).json({
        success: false,
        message: status === 400
            ? "Invalid request body"
            : "Internal server error"
    });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`NEXUS server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
