import { useState } from "react";
import axios from "axios";

function AI() {
    const [message, setMessage] = useState("");
    const [answer, setAnswer] = useState("");
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const PROJECT_ID = 1;
    const token = localStorage.getItem("token");

    const askAI = async (event) => {
        event.preventDefault();

        if (!message.trim()) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            setAnswer("");
            setSources([]);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/ai/chat`,
                {
                    project_id: PROJECT_ID,
                    message: message.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setAnswer(response.data.answer || "");
            setSources(response.data.sources || []);

        } catch (err) {
            console.error("AI ERROR:", err);

            setError(
                err.response?.data?.message ||
                "Failed to get AI response"
            );
        } finally {
            setLoading(false);
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
                    maxWidth: "1000px",
                    margin: "0 auto"
                }}
            >
                <h1>NEXUS AI</h1>

                <p
                    style={{
                        color: "#94a3b8",
                        marginBottom: "30px"
                    }}
                >
                    RAG-powered Developer Assistant
                </p>

                <div
                    style={{
                        padding: "20px",
                        marginBottom: "20px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px"
                    }}
                >
                    <h2>Ask about your project</h2>

                    <p
                        style={{
                            color: "#94a3b8"
                        }}
                    >
                        NEXUS AI uses your project and task context
                        to answer your questions.
                    </p>

                    <form onSubmit={askAI}>
                        <textarea
                            value={message}
                            onChange={(event) =>
                                setMessage(event.target.value)
                            }
                            placeholder="Example: Which tasks are currently in progress?"
                            rows="5"
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "14px",
                                marginTop: "15px",
                                background: "#020617",
                                color: "#ffffff",
                                border: "1px solid #475569",
                                borderRadius: "8px",
                                resize: "vertical"
                            }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: "12px",
                                padding: "12px 22px",
                                background: "#6366f1",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                cursor: loading
                                    ? "not-allowed"
                                    : "pointer",
                                fontWeight: "600"
                            }}
                        >
                            {loading ? "Thinking..." : "Ask NEXUS AI"}
                        </button>
                    </form>
                </div>

                {error && (
                    <div
                        style={{
                            padding: "15px",
                            marginBottom: "20px",
                            background: "#450a0a",
                            border: "1px solid #ef4444",
                            borderRadius: "8px",
                            color: "#fecaca"
                        }}
                    >
                        {error}
                    </div>
                )}

                {answer && (
                    <div
                        style={{
                            padding: "20px",
                            background: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: "12px"
                        }}
                    >
                        <h2>AI Response</h2>

                        <p
                            style={{
                                whiteSpace: "pre-wrap",
                                lineHeight: "1.7",
                                color: "#e2e8f0"
                            }}
                        >
                            {answer}
                        </p>

                        {sources.length > 0 && (
                            <div
                                style={{
                                    marginTop: "25px",
                                    paddingTop: "20px",
                                    borderTop:
                                        "1px solid #334155"
                                }}
                            >
                                <h3>Retrieved Sources</h3>

                                {sources.map((source, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: "10px",
                                            marginTop: "8px",
                                            background:
                                                "#020617",
                                            borderRadius: "6px",
                                            color: "#94a3b8"
                                        }}
                                    >
                                        {source.type} #{source.id}
                                        {" — similarity: "}
                                        {source.score}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!answer && !loading && !error && (
                    <div
                        style={{
                            padding: "30px",
                            textAlign: "center",
                            color: "#64748b",
                            border: "1px dashed #334155",
                            borderRadius: "12px"
                        }}
                    >
                        Ask your first question about NEXUS.
                    </div>
                )}
            </div>
        </div>
    );
}

export default AI;
