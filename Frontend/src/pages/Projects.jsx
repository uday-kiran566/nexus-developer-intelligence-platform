import { useEffect, useState } from "react";
import axios from "axios";

function Projects() {
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrganization, setSelectedOrganization] = useState("");
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("PLANNING");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    const fetchProjects = async (organizationId) => {
        if (!organizationId) {
            setProjects([]);
            return;
        }

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/projects/organization/${organizationId}`,
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
        let active = true;

        axios.get(
            `${import.meta.env.VITE_API_URL}/organizations`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        ).then((response) => {
            if (!active) {
                return;
            }

            const availableOrganizations = response.data.organizations || [];
            setOrganizations(availableOrganizations);
            setSelectedOrganization(String(availableOrganizations[0]?.id || ""));
        }).catch((error) => {
            if (active) {
                console.error(error);
                setError("Failed to load organizations");
            }
        });

        return () => {
            active = false;
        };
    }, [token]);

    useEffect(() => {
        if (!selectedOrganization) {
            return undefined;
        }

        let active = true;

        axios.get(
            `${import.meta.env.VITE_API_URL}/projects/organization/${selectedOrganization}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        ).then((response) => {
            if (active) {
                setProjects(response.data.projects || []);
            }
        }).catch((error) => {
            if (active) {
                console.error(error);
                setError("Failed to load projects");
            }
        });

        return () => {
            active = false;
        };
    }, [selectedOrganization, token]);

    const createProject = async (e) => {
        e.preventDefault();

        if (!selectedOrganization) {
            setError("Create or select an organization first");
            return;
        }

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
                    organization_id: Number(selectedOrganization),
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

            await fetchProjects(selectedOrganization);

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

                    <select
                        value={selectedOrganization}
                        onChange={(e) => {
                            setProjects([]);
                            setError("");
                            setSelectedOrganization(e.target.value);
                        }}
                        disabled={organizations.length === 0}
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
                        {organizations.length === 0 ? (
                            <option value="">Create an organization first</option>
                        ) : (
                            organizations.map((organization) => (
                                <option key={organization.id} value={organization.id}>
                                    {organization.name}
                                </option>
                            ))
                        )}
                    </select>

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
                        disabled={loading || organizations.length === 0}
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
