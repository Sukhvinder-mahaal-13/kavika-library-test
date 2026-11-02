import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import "./UserInfo.css";

function UserInfo() {
const [students, setStudents] = useState([]);
const [archivedStudents, setArchivedStudents] = useState([]);
const [activeTab, setActiveTab] = useState("active");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [studentAction, setStudentAction] = useState(null);


const loadStudents = async () => {
    try {
        setError("");

        const [activeResponse, archivedResponse] = await Promise.all([
            API.get("/admin/students"),
            API.get("/admin/students/archived")
        ]);

        setStudents(activeResponse.data.students || []);
        setArchivedStudents(archivedResponse.data.students || []);
    } catch (err) {
        setError(
            err.response?.data?.message ||
            "Unable to load student information."
        );
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    loadStudents();
}, []);

const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const handleArchive = async (student) => {
    const confirmed = window.confirm(
        `Are you sure you want to archive ${student.name}?`
    );

    if (!confirmed) return;

    try {
        setStudentAction(student._id);
        setError("");
        setSuccess("");

        await API.patch(`/admin/students/${student._id}/archive`);

        await loadStudents();
        setSuccess(`${student.name} has been archived successfully.`);
    } catch (err) {
        setError(
            err.response?.data?.message ||
            "Unable to archive this student."
        );
    } finally {
        setStudentAction(null);
    }
};

const handleRestore = async (student) => {
    try {
        setStudentAction(student._id);
        setError("");
        setSuccess("");

        await API.patch(`/admin/students/${student._id}/restore`);

        await loadStudents();
        setSuccess(`${student.name} has been restored successfully.`);
    } catch (err) {
        setError(
            err.response?.data?.message ||
            "Unable to restore this student."
        );
    } finally {
        setStudentAction(null);
    }
};

const handleDelete = async (student) => {
    const confirmed = window.confirm(
        `Permanently delete ${student.name}'s account? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        setStudentAction(student._id);
        setError("");
        setSuccess("");

        await API.delete(`/admin/students/${student._id}`);

        await loadStudents();
        setSuccess(`${student.name}'s account has been deleted.`);
    } catch (err) {
        setError(
            err.response?.data?.message ||
            "Unable to delete this student."
        );
    } finally {
        setStudentAction(null);
    }
};

const currentStudents =
    activeTab === "active" ? students : archivedStudents;

if (loading) {
    return (
        <main className="user-info-page">
            <div className="user-info-loading">
                <div className="user-info-spinner"></div>
                <p>Loading student information...</p>
            </div>
        </main>
    );
}

return (
    <main className="user-info-page">
        <header className="user-info-header">
            <div>
                <span className="user-info-eyebrow">ADMINISTRATION</span>
                <h1>User Information</h1>
                <p>Manage all registered and archived students.</p>
            </div>

            <Link to="/admin/dashboard" className="user-info-back-btn">
                Back to Dashboard
            </Link>
        </header>

        {error && <div className="user-info-alert error">{error}</div>}
        {success && <div className="user-info-alert success">{success}</div>}

        <section className="user-info-stats">
            <article className="user-info-stat-card">
                <span>Registered Students</span>
                <strong>{students.length}</strong>
            </article>

            <article className="user-info-stat-card">
                <span>Archived Students</span>
                <strong>{archivedStudents.length}</strong>
            </article>

            <article className="user-info-stat-card">
                <span>Total Accounts</span>
                <strong>{students.length + archivedStudents.length}</strong>
            </article>
        </section>

        <section className="user-info-section">
            <div className="user-info-section-heading">
                <div>
                    <h2>Students</h2>
                    <p>View and manage student accounts.</p>
                </div>

                <button
                    type="button"
                    className="user-info-refresh-btn"
                    onClick={loadStudents}
                >
                    Refresh
                </button>
            </div>

            <div className="user-info-tabs">
                <button
                    type="button"
                    className={activeTab === "active" ? "active" : ""}
                    onClick={() => setActiveTab("active")}
                >
                    Registered ({students.length})
                </button>

                <button
                    type="button"
                    className={activeTab === "archived" ? "active" : ""}
                    onClick={() => setActiveTab("archived")}
                >
                    Archived ({archivedStudents.length})
                </button>
            </div>

            {currentStudents.length === 0 ? (
                <div className="user-info-empty">
                    <h3>
                        {activeTab === "active"
                            ? "No Registered Students"
                            : "No Archived Students"}
                    </h3>
                    <p>Student accounts will appear here.</p>
                </div>
            ) : (
                <div className="user-info-table-wrapper">
                    <table className="user-info-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student</th>
                                <th>Address</th>
                                <th>Mobile</th>
                                <th>
                                    {activeTab === "active"
                                        ? "Registered On"
                                        : "Archived On"}
                                </th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentStudents.map((student, index) => (
                                <tr key={student._id}>
                                    <td>{index + 1}</td>

                                    <td>
                                        <div className="user-info-student">
                                            <span className="user-info-avatar">
                                                {student.name?.charAt(0)?.toUpperCase() || "S"}
                                            </span>
                                            <strong>{student.name || "Student"}</strong>
                                        </div>
                                    </td>

                                    <td>{student.address || "—"}</td>
                                    <td>{student.mobile || "—"}</td>

                                    <td>
                                        {formatDate(
                                            activeTab === "active"
                                                ? student.createdAt
                                                : student.archivedAt
                                        )}
                                    </td>

                                    <td>
                                        <span
                                            className={`user-info-status ${
                                                activeTab === "active"
                                                    ? "active"
                                                    : "archived"
                                            }`}
                                        >
                                            {activeTab === "active"
                                                ? "Active"
                                                : "Archived"}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="user-info-actions">
                                            <Link
                                                to={`/admin/students/${student._id}`}
                                                className="user-info-view-btn"
                                            >
                                                View Details
                                            </Link>

                                            {activeTab === "active" ? (
                                                <button
                                                    type="button"
                                                    className="user-info-archive-btn"
                                                    onClick={() => handleArchive(student)}
                                                    disabled={studentAction === student._id}
                                                >
                                                    {studentAction === student._id
                                                        ? "Please wait..."
                                                        : "Archive"}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="user-info-restore-btn"
                                                    onClick={() => handleRestore(student)}
                                                    disabled={studentAction === student._id}
                                                >
                                                    {studentAction === student._id
                                                        ? "Please wait..."
                                                        : "Restore"}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="user-info-delete-btn"
                                                onClick={() => handleDelete(student)}
                                                disabled={studentAction === student._id}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>

        <footer className="user-info-footer">
            © {new Date().getFullYear()} KAVIKA TEST. All rights reserved.
        </footer>
    </main>
);


}

export default UserInfo;
