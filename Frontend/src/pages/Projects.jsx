import { useEffect, useState } from "react";
import axios from "axios";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("PLANNING");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    const fetchProjects = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/projects/organization/1`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProjects(response.data.projects || []);
        } catch (error) {
            console.error(error);
            setError("Failed to load projects");
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const createProject = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Project name is required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await axios.post(
                `${import.meta.env.VITE_API_URL}/projects`,
                {
                    organization_id: 1,
                    name: name.trim(),
                    description: description.trim(),
                    status
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setName("");
            setDescription("");
            setStatus("PLANNING");

            await fetchProjects();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to create project"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">

            <header>
                <div>
                    <h1>NEXUS</h1>
                    <p>Developer Intelligence Platform</p>
                </div>
            </header>

            <main>

                <h2>Projects</h2>

                <form
                    className="auth-card"
                    onSubmit={createProject}
                >
                    <h3>Create Project</h3>

                    {error && (
                        <div className="error">
                            {error}
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Project name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Project description"
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                    />

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "14px",
                            marginTop: "15px",
                            borderRadius: "8px",
                            background: "#0f172a",
                            color: "white",
                            border: "1px solid #475569"
                        }}
                    >
                        <option value="PLANNING">Planning</option>
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating..."
                            : "Create Project"}
                    </button>
                </form>

                <div className="stats-grid">

                    {projects.map((project) => (
                        <div
                            className="stat-card"
                            key={project.id}
                        >
                            <h3>{project.name}</h3>

                            <p>
                                {project.description ||
                                    "No description"}
                            </p>

                            <p>
                                Status: <strong>
                                    {project.status}
                                </strong>
                            </p>

                            <small>
                                Project ID: {project.id}
                            </small>
                        </div>
                    ))}

                </div>

            </main>

        </div>
    );
}

export default Projects;
