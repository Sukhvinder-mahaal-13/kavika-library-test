import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api";
import "./Results.css";

function Results() {
    const navigate = useNavigate();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================
    // LOAD STUDENT RESULTS
    // =====================================

    useEffect(() => {
        const loadResults = async () => {
            try {
                const response = await API.get("/results/my-results");

                if (response.data.success) {
                    setResults(response.data.results || []);
                }

            } catch (error) {
                if (error.response?.status === 401) {
                    navigate("/", { replace: true });
                    return;
                }

                setError(
                    error.response?.data?.message ||
                    "Unable to load your results."
                );

            } finally {
                setLoading(false);
            }
        };

        loadResults();
    }, [navigate]);

    // =====================================
    // FORMAT DATE
    // =====================================

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    // =====================================
    // FORMAT TIME
    // =====================================

    const formatTime = (seconds = 0) => {
        const safeSeconds = Math.max(0, Number(seconds) || 0);

        const minutes = Math.floor(safeSeconds / 60);
        const remainingSeconds = safeSeconds % 60;

        return `${String(minutes).padStart(2, "0")}m ${String(
            remainingSeconds
        ).padStart(2, "0")}s`;
    };

    // =====================================
    // LOADING SCREEN
    // =====================================

    if (loading) {
        return (
            <div className="my-results-loading">
                <div className="my-results-spinner"></div>
                <p>Loading your results...</p>
            </div>
        );
    }

    // =====================================
    // ERROR SCREEN
    // =====================================

    if (error) {
        return (
            <main className="my-results-page">

                <div className="my-results-message">

                    <h2>Results Not Available</h2>

                    <p>{error}</p>

                    <Link
                        to="/waiting-room"
                        className="my-results-back-button"
                    >
                        ← Back to Waiting Room
                    </Link>

                </div>

            </main>
        );
    }

    // =====================================
    // MAIN RESULTS PAGE
    // =====================================

    return (
        <main className="my-results-page">

            {/* HEADER */}

            <header className="my-results-header">

                <div className="my-results-brand">

                    <div className="my-results-logo">
                        K
                    </div>

                    <div>
                        <h2>KAVIKA TEST</h2>
                        <span>Online Examination Portal</span>
                    </div>

                </div>

                <Link
                    to="/waiting-room"
                    className="my-results-back-button"
                >
                    ← Back to Waiting Room
                </Link>

            </header>

            <section className="my-results-content">

                {/* PAGE HEADING */}

                <div className="my-results-heading">

                    <span>STUDENT DASHBOARD</span>

                    <h1>My Results</h1>

                    <p>
                        Track your examination performance and see the
                        top performers in each test.
                    </p>

                </div>

                {/* SUMMARY */}

                <div className="my-results-summary">

                    <div className="my-results-summary-card">

                        <span>Published Results</span>

                        <strong>
                            {results.length}
                        </strong>

                    </div>

                    <div className="my-results-summary-card">

                        <span>Average Percentage</span>

                        <strong>
                            {results.length > 0
                                ? (
                                    results.reduce(
                                        (sum, item) =>
                                            sum + (Number(item.percentage) || 0),
                                        0
                                    ) / results.length
                                ).toFixed(2) + "%"
                                : "0%"}
                        </strong>

                    </div>

                </div>

                {/* RESULTS LIST */}

                {results.length === 0 ? (

                    <div className="my-results-empty">

                        <div className="my-results-empty-icon">
                            📋
                        </div>

                        <h2>No Published Results Yet</h2>

                        <p>
                            Your examination results will appear here
                            after the administrator publishes them.
                        </p>

                        <Link
                            to="/waiting-room"
                            className="my-results-back-button"
                        >
                            ← Back to Waiting Room
                        </Link>

                    </div>

                ) : (

                    <div className="my-results-list">

                        {results.map((item) => (

                            <article
                                className="my-result-card"
                                key={item._id}
                            >

                                {/* TEST INFORMATION */}

                                <div className="my-result-card-header">

                                    <div>

                                        <span className="my-result-label">
                                            EXAMINATION RESULT
                                        </span>

                                        <h2>
                                            {item.test?.title || "Untitled Test"}
                                        </h2>

                                        <p>
                                            📅 {formatDate(
                                                item.test?.scheduledStartAt ||
                                                item.createdAt
                                            )}
                                        </p>

                                    </div>

                                    <span className="my-result-published">
                                        ✓ Published
                                    </span>

                                </div>

                                {/* SCORE */}

                                <div className="my-result-score-section">

                                    <div className="my-result-percentage">

                                        <strong>
                                            {Number(item.percentage || 0)}%
                                        </strong>

                                        <span>YOUR SCORE</span>

                                    </div>

                                    <div className="my-result-marks">

                                        <span>Marks Obtained</span>

                                        <strong>
                                            {item.obtainedMarks}
                                            <small> / {item.totalMarks}</small>
                                        </strong>

                                    </div>

                                    <div className="my-result-rank">

                                        <span>Your Rank</span>

                                        <strong>
                                            {item.rank
                                                ? `#${item.rank}`
                                                : "Not Assigned"}
                                        </strong>

                                    </div>

                                </div>

                                {/* STATISTICS */}

                                <div className="my-result-stats">

                                    <div>
                                        <span>Correct</span>
                                        <strong>{item.correctAnswers}</strong>
                                    </div>

                                    <div>
                                        <span>Wrong</span>
                                        <strong>{item.wrongAnswers}</strong>
                                    </div>

                                    <div>
                                        <span>Unanswered</span>
                                        <strong>{item.unanswered}</strong>
                                    </div>

                                    <div>
                                        <span>Time Taken</span>
                                        <strong>
                                            {formatTime(item.timeTakenSeconds)}
                                        </strong>
                                    </div>

                                </div>

                                {/* TOP THREE PERFORMERS */}

                                {item.topThree?.length > 0 && (

                                    <div className="my-result-leaderboard">

                                        <div className="my-result-leaderboard-heading">

                                            <h3>🏆 Top 3 Performers</h3>

                                            <p>
                                                Meet the top performers of this examination.
                                            </p>

                                        </div>

                                        <div className="my-result-top-list">

                                            {item.topThree.map((student, index) => (

                                                <div
                                                    className="my-result-top-item"
                                                    key={`${student.rank}-${index}`}
                                                >

                                                    <div className="my-result-medal">
                                                        {student.rank === 1
                                                            ? "🥇"
                                                            : student.rank === 2
                                                                ? "🥈"
                                                                : "🥉"}
                                                    </div>

                                                    <div className="my-result-student-info">

                                                        <strong>
                                                            {student.name}
                                                        </strong>

                                                        <span>
                                                            {student.address ||
                                                                "Address unavailable"}
                                                        </span>

                                                    </div>

                                                    <span className="my-result-student-rank">
                                                        Rank #{student.rank}
                                                    </span>

                                                </div>

                                            ))}

                                        </div>

                                    </div>

                                )}

                                {/* VIEW DETAILED RESULT */}

                                <div className="my-result-card-footer">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(`/result/${item.test?._id}`)
                                        }
                                        disabled={!item.test?._id}
                                    >
                                        View Detailed Result →
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>

            {/* FOOTER */}

            <footer className="my-results-footer">
                © {new Date().getFullYear()} KAVIKA TEST. All rights reserved.
            </footer>

        </main>
    );
}

export default Results;