import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../api";

function Organizations() {
    const [organizations, setOrganizations] = useState([]);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingOrganizations, setLoadingOrganizations] = useState(true);

    const token = localStorage.getItem("token");

    const fetchOrganizations = async () => {
        try {
            setLoadingOrganizations(true);
            const response = await axios.get(
                `${API_URL}/organizations`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setOrganizations(response.data.organizations || []);

        } catch (error) {
            console.error(error);
            setError("Failed to load organizations");
        } finally {
            setLoadingOrganizations(false);
        }
    };

    useEffect(() => {
        let active = true;

        axios.get(`${API_URL}/organizations`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
            if (active) {
                setOrganizations(response.data.organizations || []);
            }
        }).catch((error) => {
            if (active) {
                console.error(error);
                setError("Failed to load organizations");
            }
        }).finally(() => {
            if (active) {
                setLoadingOrganizations(false);
            }
        });

        return () => {
            active = false;
        };
    }, [token]);

    const createOrganization = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Organization name is required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await axios.post(
                `${API_URL}/organizations`,
                {
                    name: name.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setName("");

            await fetchOrganizations();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to create organization"
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

                <h2>Organizations</h2>

                <form
                    className="auth-card"
                    onSubmit={createOrganization}
                >

                    <h3>Create Organization</h3>

                    {error && (
                        <div className="error">
                            {error}
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Organization name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <button type="submit" disabled={loading}>
                        {loading
                            ? "Creating..."
                            : "Create Organization"}
                    </button>

                </form>

                <div className="stats-grid">

                    {loadingOrganizations ? (
                        <p>Loading organizations...</p>
                    ) : organizations.map((organization) => (
                        <div
                            className="stat-card"
                            key={organization.id}
                        >
                            <h3>{organization.name}</h3>

                            <p>
                                Role: {organization.role}
                            </p>

                            <small>
                                Organization ID: {organization.id}
                            </small>
                        </div>
                    ))}

                </div>

            </main>

        </div>
    );
}

export default Organizations;
