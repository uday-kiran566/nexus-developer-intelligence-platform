import { NavLink, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const linkStyle = ({ isActive }) => ({
        color: isActive ? "#ffffff" : "#94a3b8",
        textDecoration: "none",
        fontWeight: isActive ? "700" : "500",
        padding: "8px 10px",
        borderRadius: "6px"
    });

    return (
        <nav
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                padding: "15px 20px",
                background: "#0f172a",
                borderBottom: "1px solid #334155"
            }}
        >
            <strong style={{ fontSize: "20px", marginRight: "15px" }}>
                NEXUS
            </strong>

            <NavLink to="/dashboard" style={linkStyle}>
                Dashboard
            </NavLink>

            <NavLink to="/organizations" style={linkStyle}>
                Organizations
            </NavLink>

            <NavLink to="/projects" style={linkStyle}>
                Projects
            </NavLink>

            <NavLink to="/tasks" style={linkStyle}>
                Tasks
            </NavLink>

            <NavLink to="/ai" style={linkStyle}>
                AI
            </NavLink>

            <NavLink to="/activity" style={linkStyle}>
                Activity
            </NavLink>

            <NavLink to="/notifications" style={linkStyle}>
                Notifications
            </NavLink>

            <button
                onClick={logout}
                style={{
                    marginLeft: "auto",
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                }}
            >
                Logout
            </button>
        </nav>
    );
}

export default Navbar;