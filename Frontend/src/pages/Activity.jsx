import { useEffect, useState } from "react";
import axios from "axios";

function Activity() {
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrganization, setSelectedOrganization] = useState("");
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/organizations`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                const availableOrganizations = response.data.organizations || [];
                setOrganizations(availableOrganizations);
                setSelectedOrganization((current) =>
                    current || String(availableOrganizations[0]?.id || "")
                );
                if (availableOrganizations.length === 0) {
                    setLoading(false);
                }
            } catch (err) {
                console.error("ORGANIZATION LOAD ERROR:", err);
                setError(
                    err.response?.data?.message ||
                    "Failed to load organizations"
                );
                setLoading(false);
            }
        };

        loadOrganizations();
    }, []);

    useEffect(() => {
        if (!selectedOrganization) {
            return undefined;
        }

        let active = true;
        const token = localStorage.getItem("token");
        axios.get(
            `${import.meta.env.VITE_API_URL}/activity/organization/${selectedOrganization}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        ).then((response) => {
            if (active) {
                setLogs(response.data.logs || []);
            }
        }).catch((err) => {
            if (active) {
                console.error("ACTIVITY ERROR:", err);
                setError(
                    err.response?.data?.message ||
                    "Failed to load activity"
                );
            }
        }).finally(() => {
            if (active) {
                setLoading(false);
            }
        });

        return () => {
            active = false;
        };
    }, [selectedOrganization]);

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "30px",
                background: "#020617",
                color: "#ffffff"
            }}
        >
            <div
                style={{
                    maxWidth: "900px",
                    margin: "0 auto"
                }}
            >
                <h1>NEXUS Activity</h1>

                <p style={{ color: "#94a3b8" }}>
                    Recent organization activity
                </p>

                <label style={{ display: "block", margin: "18px 0 8px" }}>
                    Organization
                </label>
                <select
                    value={selectedOrganization}
                    onChange={(event) => {
                        setLoading(true);
                        setError("");
                        setLogs([]);
                        setSelectedOrganization(event.target.value);
                    }}
                    disabled={organizations.length === 0}
                    style={{
                        width: "100%",
                        padding: "12px",
                        background: "#0f172a",
                        color: "#ffffff",
                        border: "1px solid #334155",
                        borderRadius: "8px"
                    }}
                >
                    {organizations.length === 0 ? (
                        <option value="">No organizations available</option>
                    ) : (
                        organizations.map((organization) => (
                            <option key={organization.id} value={organization.id}>
                                {organization.name}
                            </option>
                        ))
                    )}
                </select>

                {loading && (
                    <p>Loading activity...</p>
                )}

                {error && (
                    <div
                        style={{
                            marginTop: "20px",
                            padding: "15px",
                            background: "#450a0a",
                            border: "1px solid #ef4444",
                            borderRadius: "8px",
                            color: "#fecaca"
                        }}
                    >
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    logs.length === 0 && (
                        <div
                            style={{
                                marginTop: "20px",
                                padding: "20px",
                                background: "#0f172a",
                                border: "1px solid #334155",
                                borderRadius: "10px",
                                color: "#94a3b8"
                            }}
                        >
                            No activity recorded yet.
                        </div>
                    )}

                {logs.map((log) => (
                    <div
                        key={log.id}
                        style={{
                            marginTop: "12px",
                            padding: "18px",
                            background: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: "10px"
                        }}
                    >
                        <strong>
                            {log.user_name || "System"}
                        </strong>

                        <div
                            style={{
                                marginTop: "8px",
                                fontWeight: "600"
                            }}
                        >
                            {log.action}
                        </div>

                        {log.details && (
                            <p
                                style={{
                                    color: "#cbd5e1"
                                }}
                            >
                                {log.details}
                            </p>
                        )}

                        <small
                            style={{
                                color: "#64748b"
                            }}
                        >
                            {new Date(
                                log.created_at
                            ).toLocaleString()}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Activity;
