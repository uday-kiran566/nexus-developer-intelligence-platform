import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
    const [dashboard, setDashboard] = useState(null);

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/dashboard`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
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

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";
    };

    return (
        <div className="dashboard">

            <header>
                <div>
                    <h1>NEXUS</h1>
                    <p>Developer Intelligence Platform</p>
                </div>

                <div>
                    <span>
                        Welcome, {user.name}
                    </span>

                    <button onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <main>

                <h2>Dashboard</h2>

                <div className="stats-grid">

                    <div className="stat-card">
                        <h3>Users</h3>
                        <strong>
                            {dashboard?.totalUsers ?? 0}
                        </strong>
                    </div>

                    <div className="stat-card">
                        <h3>Organizations</h3>
                        <strong>
                            {dashboard?.totalOrganizations ?? 0}
                        </strong>
                    </div>

                    <div className="stat-card">
                        <h3>Projects</h3>
                        <strong>
                            {dashboard?.totalProjects ?? 0}
                        </strong>
                    </div>

                    <div className="stat-card">
                        <h3>Total Tasks</h3>
                        <strong>
                            {dashboard?.totalTasks ?? 0}
                        </strong>
                    </div>

                    <div className="stat-card">
                        <h3>Completed</h3>
                        <strong>
                            {dashboard?.completedTasks ?? 0}
                        </strong>
                    </div>

                    <div className="stat-card">
                        <h3>In Progress</h3>
                        <strong>
                            {dashboard?.inProgressTasks ?? 0}
                        </strong>
                    </div>

                </div>

                <section className="welcome-card">

                    <h2>Welcome to NEXUS 🚀</h2>

                    <p>
                        Your centralized platform for
                        organizations, projects, tasks,
                        collaboration and AI-powered
                        developer workflows.
                    </p>

                </section>

            </main>

        </div>
    );
}

export default Dashboard;
