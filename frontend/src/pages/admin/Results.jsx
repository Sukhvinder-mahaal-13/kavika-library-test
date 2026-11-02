import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import "./Results.css";

function Results() {
    const [tests, setTests] = useState([]);
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingResults, setLoadingResults] = useState({});
    const [publishing, setPublishing] = useState({});
    const [expandedTest, setExpandedTest] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // GET ALL TESTS
    const fetchTests = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/tests");
            const data = response.data;

            const testList = Array.isArray(data)
                ? data
                : data.tests || data.data?.tests || [];

            setTests(testList);
        } catch (err) {
            console.error("Fetch Tests Error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load examinations."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    // GET RESULTS
    const fetchTestResults = async (testId) => {
        try {
            setLoadingResults(prev => ({
                ...prev,
                [testId]: true
            }));

            const response = await API.get(
                `/results/${testId}/admin-results`
            );

            setTestResults(prev => ({
                ...prev,
                [testId]: response.data
            }));
        } catch (err) {
            console.error("Fetch Test Results Error:", err);

            setTestResults(prev => ({
                ...prev,
                [testId]: {
                    success: false,
                    message:
                        err.response?.data?.message ||
                        "Unable to load results.",
                    results: []
                }
            }));
        } finally {
            setLoadingResults(prev => ({
                ...prev,
                [testId]: false
            }));
        }
    };

    // INITIAL LOAD
    useEffect(() => {
        fetchTests();
    }, [fetchTests]);

    // OPEN / CLOSE RESULTS
    const toggleTest = async (testId) => {
        if (expandedTest === testId) {
            setExpandedTest(null);
            return;
        }

        setExpandedTest(testId);

        if (!testResults[testId]) {
            await fetchTestResults(testId);
        }
    };

    // PUBLISH / HIDE RESULTS
    const handlePublish = async (testId, currentStatus) => {
        const newStatus = !currentStatus;

        const confirmMessage = newStatus
            ? "Are you sure you want to publish results? Students will be able to view their results."
            : "Are you sure you want to hide results from students?";

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setPublishing(prev => ({
                ...prev,
                [testId]: true
            }));

            setError("");
            setSuccess("");

            const response = await API.patch(
                `/results/${testId}/visibility`,
                {
                    published: newStatus
                }
            );

            setTests(prev =>
                prev.map(test =>
                    test._id === testId
                        ? {
                            ...test,
                            resultPublished: newStatus
                        }
                        : test
                )
            );

            setSuccess(
                response.data.message ||
                "Result visibility updated successfully."
            );

            await fetchTestResults(testId);
        } catch (err) {
            console.error("Publish Result Error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to update result visibility."
            );
        } finally {
            setPublishing(prev => ({
                ...prev,
                [testId]: false
            }));
        }
    };

    // FORMAT TIME
    const formatTime = (seconds) => {
        if (seconds === undefined || seconds === null) {
            return "—";
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}m ${remainingSeconds}s`;
    };

    // STATISTICS
    const completedCount = tests.filter(
        test => String(test.status || "").toLowerCase() === "completed"
    ).length;

    const publishedCount = tests.filter(
        test =>
            String(test.status || "").toLowerCase() === "completed" &&
            test.resultPublished
    ).length;

    const pendingCount = completedCount - publishedCount;

    // LOADING
    if (loading) {
        return (
            <div className="results-page">
                <div className="results-loading">
                    <div className="results-spinner"></div>
                    <p>Loading results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="results-page">

            {/* HEADER */}
            <div className="results-header">
                <div>
                    <p className="results-eyebrow">
                        KAVIKA ADMIN PANEL
                    </p>

                    <h1>Test Results</h1>

                    <p className="results-subtitle">
                        Manage examinations, student performance and rankings.
                    </p>
                </div>

                <Link
                    to="/admin/dashboard"
                    className="results-back-btn"
                >
                    ← Dashboard
                </Link>
            </div>

            {/* ALERTS */}
            {error && (
                <div className="results-alert results-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="results-alert results-success">
                    {success}
                </div>
            )}

            {/* STATISTICS */}
            <div className="results-stats">
                <div className="results-stat-card">
                    <span>Total Tests</span>
                    <h2>{tests.length}</h2>
                </div>

                <div className="results-stat-card">
                    <span>Completed Tests</span>
                    <h2>{completedCount}</h2>
                </div>

                <div className="results-stat-card">
                    <span>Published Results</span>
                    <h2>{publishedCount}</h2>
                </div>

                <div className="results-stat-card">
                    <span>Pending Results</span>
                    <h2>{pendingCount}</h2>
                </div>
            </div>

            {/* EXAMINATIONS */}
            <div className="results-section">

                <div className="results-section-heading">
                    <div>
                        <h2>All Examinations</h2>
                        <p>
                            Choose an examination to view student results.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="results-refresh-btn"
                        onClick={fetchTests}
                    >
                        ↻ Refresh
                    </button>
                </div>

                {tests.length === 0 ? (
                    <div className="results-empty">
                        <h3>No examinations found</h3>
                        <p>Create a test to see its results here.</p>

                        <Link to="/admin/create-test">
                            Create Test
                        </Link>
                    </div>
                ) : (
                    <div className="results-test-list">

                        {tests.map(test => {
                            const testId = test._id;

                            const isPublished = Boolean(
                                test.resultPublished
                            );

                            const isCompleted =
                                String(test.status || "").toLowerCase() === "completed";

                            const isPublishing = Boolean(
                                publishing[testId]
                            );

                            const resultData = testResults[testId];

                            const studentResults =
                                resultData?.results || [];

                            return (
                                <div
                                    className="results-test-card"
                                    key={testId}
                                >

                                    {/* TEST INFORMATION */}
                                    <div className="results-test-top">

                                        <div className="results-test-info">
                                            <h3>{test.title}</h3>

                                            <p>
                                                {test.description ||
                                                    "No description available."}
                                            </p>

                                            <div className="results-test-meta">
                                                <span>
                                                    Status: {test.status || "N/A"}
                                                </span>

                                                <span>
                                                    Questions: {
                                                        test.questions?.length ??
                                                        test.totalQuestions ??
                                                        "—"
                                                    }
                                                </span>

                                                <span>
                                                    Duration: {
                                                        test.durationMinutes
                                                            ? `${test.durationMinutes} min`
                                                            : "—"
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <span
                                            className={
                                                isPublished
                                                    ? "results-badge published"
                                                    : "results-badge pending"
                                            }
                                        >
                                            {isPublished
                                                ? "Published"
                                                : "Not Published"}
                                        </span>
                                    </div>

                                    {/* ACTION BUTTONS */}
                                    <div className="results-test-actions">

                                        <button
                                            type="button"
                                            className="results-view-btn"
                                            onClick={() => toggleTest(testId)}
                                            disabled={Boolean(
                                                loadingResults[testId]
                                            )}
                                        >
                                            {loadingResults[testId]
                                                ? "Loading..."
                                                : expandedTest === testId
                                                    ? "Close Results"
                                                    : "View Results"}
                                        </button>

                                        {/* PUBLISH / HIDE BUTTON */}
                                        <button
                                            type="button"
                                            className={
                                                isPublished
                                                    ? "results-hide-btn"
                                                    : "results-publish-btn"
                                            }
                                            onClick={() =>
                                                handlePublish(
                                                    testId,
                                                    isPublished
                                                )
                                            }
                                            disabled={
                                                !isCompleted || isPublishing
                                            }
                                            title={
                                                !isCompleted
                                                    ? "Complete the test before publishing results."
                                                    : isPublished
                                                        ? "Hide results from students"
                                                        : "Publish results for students"
                                            }
                                            style={{
                                                display: "inline-flex",
                                                visibility: "visible",
                                                opacity: !isCompleted ? 0.55 : 1,
                                                minWidth: "175px",
                                                minHeight: "48px",
                                                padding: "13px 22px",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderRadius: "12px",
                                                border: "1px solid",
                                                fontSize: "14px",
                                                fontWeight: 800,
                                                color: "#ffffff",
                                                background: isPublished
                                                    ? "linear-gradient(135deg, #ff6b6b, #d93636)"
                                                    : "linear-gradient(135deg, #00b894, #008f70)",
                                                borderColor: isPublished
                                                    ? "#ed4444"
                                                    : "#00b894",
                                                boxShadow: isPublished
                                                    ? "0 5px 15px rgba(239,68,68,0.3)"
                                                    : "0 5px 15px rgba(0,184,148,0.3)",
                                                cursor: !isCompleted || isPublishing
                                                    ? "not-allowed"
                                                    : "pointer"
                                            }}
                                        >
                                            {isPublishing
                                                ? "Updating..."
                                                : isPublished
                                                    ? "Hide Results"
                                                    : "Publish Results"}
                                        </button>

                                    </div>

                                    {!isCompleted && (
                                        <p
                                            style={{
                                                margin: "10px 0 0",
                                                color: "#fbbf24",
                                                fontSize: "12px"
                                            }}
                                        >
                                            Complete this test before publishing its results.
                                        </p>
                                    )}

                                    {/* STUDENT RESULTS */}
                                    {expandedTest === testId && (
                                        <div className="results-table-wrapper">

                                            <div className="results-table-heading">
                                                <h4>Student Rankings</h4>

                                                <span>
                                                    {resultData?.totalParticipants ??
                                                        studentResults.length} Students
                                                </span>
                                            </div>

                                            {loadingResults[testId] ? (
                                                <p>Loading student results...</p>
                                            ) : studentResults.length === 0 ? (
                                                <div className="results-empty-table">
                                                    {resultData?.message ||
                                                        "No student results available."}
                                                </div>
                                            ) : (
                                                <div className="results-table-scroll">

                                                    <table className="results-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Rank</th>
                                                                <th>Student</th>
                                                                <th>Address</th>
                                                                <th>Marks</th>
                                                                <th>Correct</th>
                                                                <th>Wrong</th>
                                                                <th>Unanswered</th>
                                                                <th>Time Taken</th>
                                                                <th>Details</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {studentResults.map((item, index) => {
                                                                const student =
                                                                    item.student || {};

                                                                return (
                                                                    <tr
                                                                        key={
                                                                            item._id ||
                                                                            student._id ||
                                                                            index
                                                                        }
                                                                    >
                                                                        <td>
                                                                            <span className="results-rank">
                                                                                {item.rank || index + 1}
                                                                            </span>
                                                                        </td>

                                                                        <td>
                                                                            <strong>
                                                                                {student.name || "Unknown"}
                                                                            </strong>
                                                                        </td>

                                                                        <td>
                                                                            {student.address || "—"}
                                                                        </td>

                                                                        <td>
                                                                            <strong>
                                                                                {item.obtainedMarks ?? 0}
                                                                                /
                                                                                {item.totalMarks ?? 0}
                                                                            </strong>
                                                                        </td>

                                                                        <td>
                                                                            {item.correctAnswers ?? 0}
                                                                        </td>

                                                                        <td>
                                                                            {item.wrongAnswers ?? 0}
                                                                        </td>

                                                                        <td>
                                                                            {item.unanswered ?? 0}
                                                                        </td>

                                                                        <td>
                                                                            {formatTime(
                                                                                item.timeTakenSeconds
                                                                            )}
                                                                        </td>

                                                                        <td>
                                                                            {student._id ? (
                                                                                <Link
                                                                                    to={`/admin/students/${student._id}`}
                                                                                    className="results-detail-link"
                                                                                >
                                                                                    View
                                                                                </Link>
                                                                            ) : "—"}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>

                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            );
                        })}

                    </div>
                )}
            </div>
        </div>
    );
}

export default Results;