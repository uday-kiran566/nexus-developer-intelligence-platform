import { useEffect, useState } from "react";
import axios from "axios";

function Activity() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadActivity = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    "http://localhost:5000/api/activity/organization/1",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setLogs(response.data.logs || []);
            } catch (err) {
                console.error("ACTIVITY ERROR:", err);

                setError(
                    err.response?.data?.message ||
                    "Failed to load activity"
                );
            } finally {
                setLoading(false);
            }
        };

        loadActivity();
    }, []);

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

                {loading && (
                    <p>Loading activity...</p>
                )}

                {error && (
                    <p style={{ color: "#f87171" }}>
                        {error}
                    </p>
                )}

                {!loading &&
                    !error &&
                    logs.length === 0 && (
                        <div
                            style={{
                                padding: "20px",
                                marginTop: "20px",
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
                            padding: "18px",
                            marginTop: "12px",
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
                            <p style={{ color: "#cbd5e1" }}>
                                {log.details}
                            </p>
                        )}

                        <small style={{ color: "#64748b" }}>
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