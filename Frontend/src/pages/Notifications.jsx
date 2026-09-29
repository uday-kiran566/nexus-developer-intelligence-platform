import { useEffect, useState } from "react";
import axios from "axios";

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/notifications`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setNotifications(
                    response.data.notifications || []
                );
            } catch (err) {
                console.error(err);

                setError(
                    err.response?.data?.message ||
                    "Failed to load notifications"
                );
            } finally {
                setLoading(false);
            }
        };

        loadNotifications();
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
                <h1>NEXUS Notifications</h1>

                <p style={{ color: "#94a3b8" }}>
                    Your latest notifications
                </p>

                {loading && (
                    <p>Loading notifications...</p>
                )}

                {error && (
                    <div
                        style={{
                            padding: "15px",
                            marginTop: "20px",
                            background: "#450a0a",
                            color: "#fecaca",
                            borderRadius: "8px"
                        }}
                    >
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    notifications.length === 0 && (
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
                            No notifications yet.
                        </div>
                    )}

                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        style={{
                            marginTop: "15px",
                            padding: "18px",
                            background: notification.is_read
                                ? "#0f172a"
                                : "#172554",
                            border: "1px solid #334155",
                            borderRadius: "10px"
                        }}
                    >
                        <h3>
                            {notification.title}
                        </h3>

                        <p style={{ color: "#cbd5e1" }}>
                            {notification.message}
                        </p>

                        <small
                            style={{ color: "#64748b" }}
                        >
                            {new Date(
                                notification.created_at
                            ).toLocaleString()}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Notifications;

