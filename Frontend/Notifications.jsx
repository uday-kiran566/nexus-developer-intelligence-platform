import { useEffect, useState } from "react";
import axios from "axios";

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/notifications",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications(response.data.notifications || []);
        } catch (err) {
            console.error("NOTIFICATIONS ERROR:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load notifications"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem("token");

            await axios.put(
                `http://localhost:5000/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, is_read: 1 }
                        : notification
                )
            );
        } catch (err) {
            console.error("MARK READ ERROR:", err);

            setError(
                err.response?.data?.message ||
                "Failed to mark notification as read"
            );
        }
    };

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
                    Your latest project notifications
                </p>

                {loading && <p>Loading notifications...</p>}

                {error && (
                    <div
                        style={{
                            padding: "12px",
                            marginTop: "15px",
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
                    notifications.length === 0 && (
                        <div
                            style={{
                                marginTop: "20px",
                                padding: "25px",
                                background: "#0f172a",
                                border: "1px solid #334155",
                                borderRadius: "10px",
                                color: "#94a3b8"
                            }}
                        >
                            No notifications yet.
                        </div>
                    )}

                {!error &&
                    notifications.map((notification) => (
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
                            <h3 style={{ marginTop: 0 }}>
                                {notification.title}
                            </h3>

                            <p style={{ color: "#cbd5e1" }}>
                                {notification.message ||
                                    "No message"}
                            </p>

                            <small style={{ color: "#64748b" }}>
                                {new Date(
                                    notification.created_at
                                ).toLocaleString()}
                            </small>

                            {!notification.is_read && (
                                <div>
                                    <button
                                        onClick={() =>
                                            markAsRead(
                                                notification.id
                                            )
                                        }
                                        style={{
                                            marginTop: "12px",
                                            padding: "8px 14px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Mark as read
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
}

export default Notifications;