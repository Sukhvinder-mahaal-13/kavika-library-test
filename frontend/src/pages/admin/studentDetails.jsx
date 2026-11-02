import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../services/api";
import "./StudentDetails.css";

function StudentDetails() {
    const { studentId } = useParams();

    const [student, setStudent] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [results, setResults] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await API.get(
                    `/admin/students/${studentId}`
                );

                setStudent(response.data.student);
                setPerformance(response.data.performance);
                setResults(response.data.results || []);

            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load student details."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDetails();
    }, [studentId]);

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatTime = (seconds) => {
        if (seconds === undefined || seconds === null) {
            return "—";
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}m ${remainingSeconds}s`;
    };

    const getPercentage = (obtained, total) => {
        if (!total) return 0;

        return Math.round((obtained / total) * 100);
    };

    // Loading screen
    if (loading) {
        return (
            <div className="student-details-loading">
                <div className="student-details-spinner"></div>
                <p>Loading student details...</p>
            </div>
        );
    }

    // Error screen
    if (error || !student) {
        return (
            <main className="student-details-page">
                <div className="student-details-error">
                    <h2>Student Details Not Available</h2>
                    <p>{error || "Student not found."}</p>

                    <Link
                        to="/admin/dashboard"
                        className="student-back-btn"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="student-details-page">

            {/* HEADER */}

            <header className="student-details-header">
                <div>
                    <Link
                        to="/admin/dashboard"
                        className="student-back-link"
                    >
                        ← Back to Dashboard
                    </Link>

                    <span className="student-details-eyebrow">
                        ADMIN PANEL / STUDENTS
                    </span>

                    <h1>Student Details</h1>

                    <p>
                        View personal information and examination performance.
                    </p>
                </div>

                <span
                    className={`student-account-status ${
                        student.isArchived ? "archived" : "active"
                    }`}
                >
                    {student.isArchived
                        ? "Archived Account"
                        : "Active Account"}
                </span>
            </header>

            {/* STUDENT PROFILE */}

            <section className="student-profile-card">

                <div className="student-profile-avatar">
                    {student.name?.charAt(0)?.toUpperCase() || "S"}
                </div>

                <div className="student-profile-heading">
                    <span>STUDENT PROFILE</span>

                    <h2>{student.name}</h2>

                    <p>
                        Registered on {formatDate(student.createdAt)}
                    </p>
                </div>

            </section>

            {/* PERSONAL INFORMATION */}

            <section className="student-details-section">

                <div className="student-section-heading">
                    <div>
                        <span>PERSONAL INFORMATION</span>
                        <h2>Student Information</h2>
                    </div>
                </div>

                <div className="student-information-grid">

                    <div className="student-information-item">
                        <span>Full Name</span>
                        <strong>{student.name || "—"}</strong>
                    </div>

                    <div className="student-information-item">
                        <span>Mobile Number</span>
                        <strong>{student.mobile || "—"}</strong>
                    </div>

                    <div className="student-information-item student-address-item">
                        <span>Address</span>
                        <strong>{student.address || "—"}</strong>
                    </div>

                    <div className="student-information-item">
                        <span>Registration Date</span>
                        <strong>{formatDate(student.createdAt)}</strong>
                    </div>

                    <div className="student-information-item">
                        <span>Account Status</span>
                        <strong>
                            {student.isArchived ? "Archived" : "Active"}
                        </strong>
                    </div>

                </div>

            </section>

            {/* OVERALL PERFORMANCE */}

            <section className="student-details-section">

                <div className="student-section-heading">
                    <div>
                        <span>EXAMINATION OVERVIEW</span>
                        <h2>Overall Performance</h2>
                    </div>
                </div>

                <div className="student-performance-grid">

                    <div className="student-performance-card">
                        <span>Total Tests</span>

                        <strong>
                            {performance?.totalTests ?? 0}
                        </strong>

                        <small>Examinations attempted</small>
                    </div>

                    <div className="student-performance-card">
                        <span>Average Percentage</span>

                        <strong>
                            {performance?.averagePercentage ?? 0}%
                        </strong>

                        <small>Across all attempted tests</small>
                    </div>

                    <div className="student-performance-card">
                        <span>Best Result</span>

                        <strong>
                            {performance?.bestResult
                                ? `${getPercentage(
                                    performance.bestResult.obtainedMarks,
                                    performance.bestResult.totalMarks
                                )}%`
                                : "—"}
                        </strong>

                        <small>
                            {performance?.bestResult?.test?.title ||
                                "No result available"}
                        </small>
                    </div>

                </div>

            </section>

            {/* EXAMINATION HISTORY */}

            <section className="student-details-section">

                <div className="student-section-heading">
                    <div>
                        <span>TEST RECORDS</span>
                        <h2>Examination History</h2>

                        <p>
                            Complete performance details for each attempted test.
                        </p>
                    </div>

                    <span className="student-results-count">
                        {results.length} Results
                    </span>
                </div>

                {results.length === 0 ? (

                    <div className="student-no-results">
                        <div className="student-no-results-icon">
                            📋
                        </div>

                        <h3>No Examination Records</h3>

                        <p>
                            This student has not attempted any examination yet.
                            Results will appear here after a test is completed.
                        </p>
                    </div>

                ) : (

                    <div className="student-results-list">

                        {results.map((result, index) => {

                            const percentage = getPercentage(
                                result.obtainedMarks,
                                result.totalMarks
                            );

                            return (
                                <article
                                    className="student-result-card"
                                    key={result._id || index}
                                >

                                    <div className="student-result-header">

                                        <div>
                                            <span>
                                                EXAMINATION {index + 1}
                                            </span>

                                            <h3>
                                                {result.test?.title ||
                                                    "Test no longer available"}
                                            </h3>

                                            <p>
                                                Attempted on{" "}
                                                {formatDate(result.createdAt)}
                                            </p>
                                        </div>

                                        <div className="student-result-score">
                                            <strong>{percentage}%</strong>
                                            <span>Score</span>
                                        </div>

                                    </div>

                                    <div className="student-result-marks">

                                        <div>
                                            <span>Obtained Marks</span>
                                            <strong>
                                                {result.obtainedMarks ?? 0}
                                                {" / "}
                                                {result.totalMarks ?? 0}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Correct Answers</span>
                                            <strong className="result-correct">
                                                {result.correctAnswers ?? 0}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Wrong Answers</span>
                                            <strong className="result-wrong">
                                                {result.wrongAnswers ?? 0}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Unanswered</span>
                                            <strong>
                                                {result.unanswered ?? 0}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Rank</span>
                                            <strong>
                                                {result.rank ?? "—"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Time Taken</span>
                                            <strong>
                                                {formatTime(result.timeTakenSeconds)}
                                            </strong>
                                        </div>

                                    </div>

                                </article>
                            );
                        })}

                    </div>
                )}

            </section>

            <footer className="student-details-footer">
                KAVIKA TEST · Student Management
            </footer>

        </main>
    );
}

export default StudentDetails;