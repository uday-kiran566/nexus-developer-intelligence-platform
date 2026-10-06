import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        try {
            const response = await axios.post(
                `${API_URL}/auth/login`,
                {
                    email,
                    password
                }
            );

            localStorage.setItem("token", response.data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            navigate("/dashboard");

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Login failed"
            );
        }
    };

    return (
        <div className="auth-container">

            <form
                className="auth-card"
                onSubmit={handleLogin}
            >

                <h1>NEXUS</h1>

                <p>
                    Developer Intelligence Platform
                </p>

                {error && (
                    <div className="error">
                        {error}
                    </div>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    required
                />

                <button type="submit">
                    Sign In
                </button>

                <p>
                    Don't have an account?{" "}

                    <Link to="/register">
                        Create account
                    </Link>
                </p>

            </form>

        </div>
    );
}

export default Login;
