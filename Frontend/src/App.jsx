import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import AI from "./pages/AI";
import Activity from "./pages/Activity";
import Notifications from "./pages/Notifications";
import Navbar from "./components/Navbar";

function AppLayout() {
    const location = useLocation();

    const publicPages = [
        "/login",
        "/register"
    ];

    const showNavbar =
        !publicPages.includes(location.pathname);

    return (
        <>
            {showNavbar && <Navbar />}

            <Routes>
                <Route
                    path="/"
                    element={
                        <Navigate to="/dashboard" />
                    }
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/organizations"
                    element={<Organizations />}
                />

                <Route
                    path="/projects"
                    element={<Projects />}
                />

                <Route
                    path="/tasks"
                    element={<Tasks />}
                />

                <Route
                    path="/ai"
                    element={<AI />}
                />

                <Route
                    path="/activity"
                    element={<Activity />}
                />

                <Route
                    path="/notifications"
                    element={<Notifications />}
                />
            </Routes>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}

export default App;