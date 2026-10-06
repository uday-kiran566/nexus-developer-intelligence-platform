import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../api";

function Dashboard() {
    const [dashboard, setDashboard] = useState(null);

    let user = {};

    try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            user = JSON.parse(storedUser);
        }
    } catch (error) {
        console.error("User data error:", error);
    }

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${API_URL}/dashboard`,
                    {
                        headers: {
                            Authorization: "Bearer " + token
                        }
                    }
                );

                setDashboard(response.data.dashboard);
            } catch (error) {
                console.error("Dashboard error:", error);
            }
        };

        fetchDashboard();
    }, []);

    const organizations = dashboard
        ? dashboard.totalOrganizations || 0
        : 0;

    const projects = dashboard
        ? dashboard.totalProjects || 0
        : 0;

    const tasks = dashboard
        ? dashboard.totalTasks || 0
        : 0;

    const completed = dashboard
        ? dashboard.completedTasks || 0
        : 0;

    const inProgress = dashboard
        ? dashboard.inProgressTasks || 0
        : 0;

    const users = dashboard
        ? dashboard.totalUsers || 0
        : 0;

    const completion =
        tasks > 0
            ? Math.round((completed / tasks) * 100)
            : 0;

    return (
        <div className="nexus-dash">

            <header className="nexus-dash-header">

                <div className="nexus-dash-header-copy">
                    <div className="nexus-dash-label">
                        DEVELOPER WORKSPACE
                    </div>

                    <h1>
                        Welcome back,
                        <span>
                            {user.name || "Developer"}
                        </span>
                    </h1>

                    <p>
                        Everything you need to manage your
                        development workflow in one place.
                    </p>
                </div>

                <div className="nexus-dash-account">
                    <div className="nexus-dash-status">
                        <span></span>
                        Online
                    </div>

                    <div className="nexus-dash-avatar">
                        {(user.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                    </div>
                </div>

            </header>

            <section className="nexus-dash-section">

                <div className="nexus-dash-section-head">

                    <div>
                        <div className="nexus-dash-label">
                            OVERVIEW
                        </div>

                        <h2>
                            Workspace Intelligence
                        </h2>
                    </div>

                    <div className="nexus-dash-live">
                        <span></span>
                        LIVE
                    </div>

                </div>

                <div className="nexus-dash-stats">

                    <div className="nexus-dash-stat">
                        <div className="nexus-dash-stat-icon">
                            ◈
                        </div>

                        <div className="nexus-dash-stat-number">
                            {organizations}
                        </div>

                        <div className="nexus-dash-stat-name">
                            Organizations
                        </div>

                        <div className="nexus-dash-stat-meta">
                            Active workspaces
                        </div>
                    </div>

                    <div className="nexus-dash-stat">
                        <div className="nexus-dash-stat-icon">
                            ▣
                        </div>

                        <div className="nexus-dash-stat-number">
                            {projects}
                        </div>

                        <div className="nexus-dash-stat-name">
                            Projects
                        </div>

                        <div className="nexus-dash-stat-meta">
                            Development projects
                        </div>
                    </div>

                    <div className="nexus-dash-stat">
                        <div className="nexus-dash-stat-icon">
                            ✓
                        </div>

                        <div className="nexus-dash-stat-number">
                            {tasks}
                        </div>

                        <div className="nexus-dash-stat-name">
                            Total Tasks
                        </div>

                        <div className="nexus-dash-stat-meta">
                            Tracked workload
                        </div>
                    </div>

                    <div className="nexus-dash-stat">
                        <div className="nexus-dash-stat-icon">
                            ●
                        </div>

                        <div className="nexus-dash-stat-number">
                            {completed}
                        </div>

                        <div className="nexus-dash-stat-name">
                            Completed
                        </div>

                        <div className="nexus-dash-stat-meta">
                            Finished tasks
                        </div>
                    </div>

                    <div className="nexus-dash-stat">
                        <div className="nexus-dash-stat-icon">
                            ◷
                        </div>

                        <div className="nexus-dash-stat-number">
                            {inProgress}
                        </div>

                        <div className="nexus-dash-stat-name">
                            In Progress
                        </div>

                        <div className="nexus-dash-stat-meta">
                            Currently active
                        </div>
                    </div>

                    <div className="nexus-dash-stat">
                        <div className="nexus-dash-stat-icon">
                            ◎
                        </div>

                        <div className="nexus-dash-stat-number">
                            {users}
                        </div>

                        <div className="nexus-dash-stat-name">
                            Users
                        </div>

                        <div className="nexus-dash-stat-meta">
                            Workspace members
                        </div>
                    </div>

                </div>

            </section>

            <section className="nexus-dash-main-grid">

                <div className="nexus-dash-panel">

                    <div className="nexus-dash-panel-top">

                        <div>
                            <div className="nexus-dash-label">
                                DEVELOPMENT HEALTH
                            </div>

                            <h2>
                                Task completion
                            </h2>
                        </div>

                        <div className="nexus-dash-panel-icon">
                            ✦
                        </div>

                    </div>

                    <div className="nexus-dash-health">

                        <div className="nexus-dash-percent">
                            <strong>
                                {completion}%
                            </strong>

                            <span>
                                Complete
                            </span>
                        </div>

                        <div className="nexus-dash-health-content">

                            <div className="nexus-dash-progress-track">
                                <div
                                    className="nexus-dash-progress-bar"
                                    style={{
                                        width:
                                            completion + "%"
                                    }}
                                ></div>
                            </div>

                            <div className="nexus-dash-health-row">
                                <span>
                                    Completed
                                </span>

                                <strong>
                                    {completed}
                                </strong>
                            </div>

                            <div className="nexus-dash-health-row">
                                <span>
                                    In Progress
                                </span>

                                <strong>
                                    {inProgress}
                                </strong>
                            </div>

                            <div className="nexus-dash-health-row">
                                <span>
                                    Total Tasks
                                </span>

                                <strong>
                                    {tasks}
                                </strong>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="nexus-dash-panel">

                    <div className="nexus-dash-panel-top">

                        <div>
                            <div className="nexus-dash-label">
                                WORKFLOW
                            </div>

                            <h2>
                                Quick actions
                            </h2>
                        </div>

                        <div className="nexus-dash-panel-icon">
                            +
                        </div>

                    </div>

                    <div className="nexus-dash-actions">

                        <a
                            href="/projects"
                            className="nexus-dash-action"
                        >
                            <div className="nexus-dash-action-icon">
                                ▣
                            </div>

                            <div>
                                <strong>
                                    Projects
                                </strong>

                                <span>
                                    Manage your development work
                                </span>
                            </div>

                            <b>
                                →
                            </b>
                        </a>

                        <a
                            href="/tasks"
                            className="nexus-dash-action"
                        >
                            <div className="nexus-dash-action-icon">
                                ✓
                            </div>

                            <div>
                                <strong>
                                    Tasks
                                </strong>

                                <span>
                                    Track your engineering work
                                </span>
                            </div>

                            <b>
                                →
                            </b>
                        </a>

                        <a
                            href="/ai"
                            className="nexus-dash-action nexus-dash-ai-action"
                        >
                            <div className="nexus-dash-action-icon">
                                ✦
                            </div>

                            <div>
                                <strong>
                                    AI Workspace
                                </strong>

                                <span>
                                    Intelligent developer tools
                                </span>
                            </div>

                            <b>
                                →
                            </b>
                        </a>

                    </div>

                </div>

            </section>

            <section className="nexus-dash-hero">

                <div className="nexus-dash-hero-content">

                    <div className="nexus-dash-label">
                        NEXUS PLATFORM
                    </div>

                    <h2>
                        One workspace.
                        <br />
                        Everything connected.
                    </h2>

                    <p>
                        Manage organizations, projects,
                        tasks, collaboration and AI-powered
                        developer workflows from one intelligent
                        platform.
                    </p>

                    <div className="nexus-dash-tags">
                        <span>Projects</span>
                        <span>Tasks</span>
                        <span>Collaboration</span>
                        <span>AI</span>
                    </div>

                </div>

                <div className="nexus-dash-logo">
                    N
                </div>

            </section>

        </div>
    );
}

export default Dashboard;