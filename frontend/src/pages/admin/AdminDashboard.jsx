import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
const navigate = useNavigate();


const [admin, setAdmin] = useState(null);
const [tests, setTests] = useState([]);

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const [loggingOut, setLoggingOut] = useState(false);
const [deletingTest, setDeletingTest] = useState(null);

// =====================================
// LOAD DASHBOARD
// =====================================

const loadDashboard = async () => {
    try {
        setError("");

        const [adminResponse, testsResponse] = await Promise.all([
            API.get("/admin/me"),
            API.get("/tests")
        ]);

        setAdmin(adminResponse.data.admin);
        setTests(testsResponse.data.tests || []);

    } catch (error) {
        if (error.response?.status === 401) {
            navigate("/admin", { replace: true });
            return;
        }

        setError(
            error.response?.data?.message ||
            "Unable to load dashboard."
        );

    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    loadDashboard();
}, []);

// =====================================
// ADMIN LOGOUT
// =====================================

const handleLogout = async () => {
    try {
        setLoggingOut(true);
        setError("");

        await API.post("/admin/logout");

        navigate("/admin", { replace: true });

    } catch (error) {
        setError(
            error.response?.data?.message ||
            "Unable to logout. Please try again."
        );

    } finally {
        setLoggingOut(false);
    }
};

// =====================================
// FORMAT DATE
// =====================================

const formatDate = (date) => {
    if (!date) return "Not scheduled";

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

// =====================================
// DELETE TEST
// =====================================

const handleDeleteTest = async (test) => {
    const firstConfirmation = window.confirm(
        `Are you sure you want to delete "${test.title}"?`
    );

    if (!firstConfirmation) return;

    const secondConfirmation = window.confirm(
        "FINAL CONFIRMATION: This action cannot be undone. Do you really want to delete this test?"
    );

    if (!secondConfirmation) return;

    try {
        setError("");
        setSuccess("");
        setDeletingTest(test._id);

        await API.delete(`/tests/${test._id}`);

        setTests(previous =>
            previous.filter(item => item._id !== test._id)
        );

        setSuccess("Test deleted successfully.");

    } catch (error) {
        setError(
            error.response?.data?.message ||
            "Unable to delete test."
        );

    } finally {
        setDeletingTest(null);
    }
};

// =====================================
// TEST STATISTICS
// =====================================

const scheduledTests = tests.filter(
    test => test.status === "scheduled"
).length;

const liveTests = tests.filter(
    test => test.status === "live"
).length;

const completedTests = tests.filter(
    test => test.status === "completed"
).length;

// =====================================
// LOADING SCREEN
// =====================================

if (loading) {
    return (
        <div className="admin-dashboard-loading">
            <div className="admin-dashboard-spinner"></div>
            <p>Loading Admin Dashboard...</p>
        </div>
    );
}

// =====================================
// DASHBOARD UI
// =====================================

return (
    <main className="admin-dashboard-page">

        {/* SIDEBAR */}

        <aside className="admin-sidebar">

            <div className="admin-sidebar-brand">

                <div className="admin-dashboard-logo">
                    K
                </div>

                <div>
                    <h2>KAVIKA</h2>
                    <span>ADMIN PANEL</span>
                </div>

            </div>

            <nav className="admin-sidebar-nav">

                <p className="sidebar-section-title">
                    MAIN MENU
                </p>

                <NavLink
                    to="/admin/dashboard"
                    end
                    className={({ isActive }) =>
                        `admin-nav-link ${isActive ? "active" : ""}`
                    }
                >
                    <span>⌂</span>
                    Dashboard
                </NavLink>

                <NavLink
                    to="/admin/create-test"
                    className={({ isActive }) =>
                        `admin-nav-link ${isActive ? "active" : ""}`
                    }
                >
                    <span>＋</span>
                    Create Test
                </NavLink>

                <NavLink
                    to="/admin/user-info"
                    className={({ isActive }) =>
                        `admin-nav-link ${isActive ? "active" : ""}`
                    }
                >
                    <span>♙</span>
                    User Info
                </NavLink>

                <NavLink
                    to="/admin/results"
                    className={({ isActive }) =>
                        `admin-nav-link ${isActive ? "active" : ""}`
                    }
                >
                    <span>▤</span>
                    Results
                </NavLink>

                <a
                    href="#all-examinations"
                    className="admin-nav-link"
                >
                    <span>▣</span>
                    All Examinations
                </a>

            </nav>

            {/* SIDEBAR BOTTOM */}

            <div className="admin-sidebar-bottom">

                <div className="admin-sidebar-profile">

                    <div className="admin-profile-avatar">
                        {admin?.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>

                    <div>
                        <strong>
                            {admin?.name || "Administrator"}
                        </strong>

                        <span>Administrator</span>
                    </div>

                </div>

                <button
                    type="button"
                    className="admin-sidebar-logout"
                    onClick={handleLogout}
                    disabled={loggingOut}
                >
                    <span>↪</span>
                    {loggingOut ? "Logging out..." : "Logout"}
                </button>

            </div>

        </aside>

        {/* MAIN DASHBOARD */}

        <section className="admin-dashboard-main">

            {/* HEADER */}

            <header className="admin-dashboard-header">

                <div>
                    <span className="admin-dashboard-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1>Dashboard</h1>

                    <p>
                        Manage examinations and participants.
                    </p>
                </div>

                <Link
                    to="/admin/create-test"
                    className="admin-create-test-btn"
                >
                    <span>＋</span>
                    Create New Test
                </Link>

            </header>

            {/* ERROR MESSAGE */}

            {error && (
                <div className="admin-dashboard-error">
                    {error}
                </div>
            )}

            {/* SUCCESS MESSAGE */}

            {success && (
                <div className="admin-dashboard-success">
                    {success}
                </div>
            )}

            {/* WELCOME CARD */}

            <section className="admin-welcome-card">

                <div>
                    <span>WELCOME BACK</span>

                    <h2>
                        Hello, {admin?.name || "Administrator"}!
                    </h2>

                    <p>
                        Here's an overview of your examination portal.
                    </p>
                </div>

              

            </section>

            {/* STATISTICS */}

            <section className="admin-stats-grid">

                <div className="admin-stat-card">

                    <div className="admin-stat-top">
                        <span>Total Tests</span>
                        <div className="stat-icon purple">▤</div>
                    </div>

                    <h2>{tests.length}</h2>
                    <p>All created examinations</p>

                </div>

                <div className="admin-stat-card">

                    <div className="admin-stat-top">
                        <span>Scheduled Tests</span>
                        <div className="stat-icon blue">◷</div>
                    </div>

                    <h2>{scheduledTests}</h2>
                    <p>Upcoming examinations</p>

                </div>

                <div className="admin-stat-card">

                    <div className="admin-stat-top">
                        <span>Live Tests</span>
                        <div className="stat-icon green">●</div>
                    </div>

                    <h2>{liveTests}</h2>
                    <p>Currently active examinations</p>

                </div>

                <div className="admin-stat-card">

                    <div className="admin-stat-top">
                        <span>Completed Tests</span>
                        <div className="stat-icon orange">✓</div>
                    </div>

                    <h2>{completedTests}</h2>
                    <p>Finished examinations</p>

                </div>

            </section>

            {/* ALL EXAMINATIONS */}

            <section
                className="admin-tests-section"
                id="all-examinations"
            >

                <div className="admin-section-heading">

                    <div>
                        <h2>All Examinations</h2>

                        <p>
                            View and manage your created tests.
                        </p>
                    </div>

                    <span className="admin-test-count">
                        {tests.length} Tests
                    </span>

                </div>

                {tests.length === 0 ? (

                    <div className="admin-empty-state">

                        <div className="admin-empty-icon">
                            ▤
                        </div>

                        <h3>No Tests Created Yet</h3>

                        <p>
                            Create your first examination to get started.
                        </p>

                        <Link
                            to="/admin/create-test"
                            className="admin-empty-btn"
                        >
                            Create Your First Test
                        </Link>

                    </div>

                ) : (

                    <div className="admin-test-list">

                        {tests.map(test => (

                            <article
                                className="admin-test-card"
                                key={test._id}
                            >

                                <div className="admin-test-card-info">

                                    <div className="admin-test-icon">
                                        ▤
                                    </div>

                                    <div>
                                        <h3>{test.title}</h3>

                                        <p>
                                            {test.description ||
                                                "No description provided."}
                                        </p>
                                    </div>

                                </div>

                                <div className="admin-test-meta">

                                    <div>
                                        <span>START DATE</span>

                                        <strong>
                                            {formatDate(test.scheduledStartAt)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>DURATION</span>

                                        <strong>
                                            {test.durationMinutes} Minutes
                                        </strong>
                                    </div>

                                    <div>
                                        <span>QUESTIONS</span>

                                        <strong>
                                            {test.totalQuestions || 0}
                                        </strong>
                                    </div>

                                </div>

                                <div className="admin-test-status-wrapper">

                                    <span
                                        className={`admin-test-status status-${test.status}`}
                                    >
                                        {test.status}
                                    </span>

                                </div>

                                <div className="admin-test-actions">

                                    <button
                                        type="button"
                                        className="admin-manage-questions-btn"
                                        onClick={() =>
                                            navigate(
                                                `/admin/tests/${test._id}/questions`
                                            )
                                        }
                                    >
                                        📝 Manage Questions
                                    </button>

                                    {[
                                        "draft",
                                        "scheduled",
                                        "cancelled",
                                        "completed"
                                    ].includes(test.status?.toLowerCase()) && (

                                        <button
                                            type="button"
                                            className="admin-delete-test-btn"
                                            onClick={() => handleDeleteTest(test)}
                                            disabled={deletingTest === test._id}
                                        >
                                            {deletingTest === test._id
                                                ? "Deleting..."
                                                : "Delete Test"}
                                        </button>

                                    )}

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>

            {/* FOOTER */}

            <footer className="admin-dashboard-footer">
                © {new Date().getFullYear()} KAVIKA TEST. All rights reserved.
            </footer>

        </section>

    </main>
);


}

export default AdminDashboard;
