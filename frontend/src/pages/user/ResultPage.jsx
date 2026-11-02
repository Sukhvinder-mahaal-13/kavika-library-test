import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import "./ResultPage.css";

function ResultPage() {
const { testId } = useParams();
const navigate = useNavigate();


const [result, setResult] = useState(null);
const [topThree, setTopThree] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
    let isMounted = true;

    const loadResult = async () => {
        try {
            const response = await API.get(
                `/results/${testId}/my-result`
            );

            if (!isMounted) return;

            if (response.data.success) {
                setResult(response.data.result);
                setTopThree(response.data.topThree || []);
            } else {
                setError("Unable to load your result.");
            }

        } catch (error) {
            if (!isMounted) return;

            if (error.response?.status === 401) {
                navigate("/");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to load your result."
            );

        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    };

    loadResult();

    return () => {
        isMounted = false;
    };
}, [testId, navigate]);

const formatTime = (seconds = 0) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}m ${String(
        remainingSeconds
    ).padStart(2, "0")}s`;
};

const getPercentage = () => {
    if (!result || result.totalMarks === 0) return 0;

    return Math.round(
        (result.obtainedMarks / result.totalMarks) * 100
    );
};

// Loading screen
if (loading) {
    return (
        <div className="result-loading">
            <div className="result-spinner"></div>
            <p>Preparing your result...</p>
        </div>
    );
}

// Error screen
if (error) {
    return (
        <div className="result-error">
            <h2>Result Not Available</h2>
            <p>{error}</p>

            <button
                type="button"
                onClick={() => navigate("/waiting-room")}
            >
                Back to Waiting Room →
            </button>
        </div>
    );
}

if (!result) {
    return (
        <div className="result-error">
            <h2>Result Not Available</h2>
            <p>Your result could not be found.</p>

            <button
                type="button"
                onClick={() => navigate("/waiting-room")}
            >
                Back to Waiting Room →
            </button>
        </div>
    );
}

const percentage = getPercentage();

return (
    <main className="result-page">

        {/* Header */}
        <header className="result-header">

            <div className="result-brand">
                <div className="result-logo">K</div>

                <div>
                    <h2>KAVIKA TEST</h2>
                    <span>Online Examination Portal</span>
                </div>
            </div>

            <span className="result-completed-badge">
                ✓ TEST COMPLETED
            </span>

        </header>

        <section className="result-content">

            {/* Result Hero */}
            <div className="result-hero">

                <div className="result-success-icon">✓</div>

                <span className="result-eyebrow">
                    EXAMINATION COMPLETED
                </span>

                <h1>Well Done!</h1>

                <p>
                    Your test has been successfully submitted.
                    Here is your performance summary.
                </p>

                <h2 className="result-test-title">
                    {result.testTitle}
                </h2>

            </div>

            {/* Score Card */}
            <div className="result-score-card">

                <div className="result-score-circle">
                    <div>
                        <strong>{percentage}%</strong>
                        <span>YOUR SCORE</span>
                    </div>
                </div>

                <div className="result-score-details">

                    <span>YOUR FINAL SCORE</span>

                    <h2>
                        {result.obtainedMarks}
                        <small> / {result.totalMarks}</small>
                    </h2>

                    <p>
                        You scored {percentage}% in this examination.
                    </p>

                </div>

            </div>

            {/* Performance Statistics */}
            <div className="result-section">

                <div className="result-section-heading">
                    <h2>Performance Overview</h2>
                    <p>Your detailed examination statistics</p>
                </div>

                <div className="result-stats-grid">

                    <div className="result-stat-card correct-card">
                        <div className="result-stat-icon">✓</div>
                        <span>Correct Answers</span>
                        <strong>{result.correctAnswers}</strong>
                    </div>

                    <div className="result-stat-card wrong-card">
                        <div className="result-stat-icon">✕</div>
                        <span>Wrong Answers</span>
                        <strong>{result.wrongAnswers}</strong>
                    </div>

                    <div className="result-stat-card unanswered-card">
                        <div className="result-stat-icon">–</div>
                        <span>Unanswered</span>
                        <strong>{result.unanswered}</strong>
                    </div>

                    <div className="result-stat-card time-card">
                        <div className="result-stat-icon">◷</div>
                        <span>Time Taken</span>
                        <strong>{formatTime(result.timeTakenSeconds)}</strong>
                    </div>

                </div>

            </div>

            {/* Rank Card */}
            <div className="result-rank-card">

                <div>
                    <span>YOUR FINAL RANK</span>

                    <h2>
                        {result.rank
                            ? `#${result.rank}`
                            : "Not Assigned"}
                    </h2>

                    <p>
                        Your rank is based on your final examination score.
                    </p>
                </div>

                <div className="result-trophy">
                    🏆
                </div>

            </div>

            {/* Top 3 Leaderboard */}
            {topThree.length > 0 && (

                <div className="result-leaderboard">

                    <div className="result-section-heading">
                        <h2>Top 3 Performers</h2>
                        <p>Congratulations to our top performers!</p>
                    </div>

                    <div className="leaderboard-list">

                        {topThree.map((student, index) => (

                            <div
                                className={`leaderboard-item rank-${student.rank}`}
                                key={`${student.rank}-${index}`}
                            >

                                <div className="leaderboard-position">
                                    {student.rank === 1
                                        ? "🥇"
                                        : student.rank === 2
                                            ? "🥈"
                                            : "🥉"}
                                </div>

                                <div className="leaderboard-student">
                                    <strong>{student.name}</strong>

                                    <span>
                                        {student.address || "Address unavailable"}
                                    </span>

                                    <span>Rank {student.rank}</span>
                                </div>

                            </div>

                        ))}

                    </div>

                </div>

            )}

            {/* Footer Message */}
            <div className="result-footer-card">

                <h3>Thank You for Participating!</h3>

                <p>
                    Keep learning, keep practicing, and keep improving.
                    Your next achievement is waiting for you.
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/waiting-room")}
                >
                    Back to Waiting Room →
                </button>

            </div>

        </section>

        <footer className="result-footer">
            © {new Date().getFullYear()} KAVIKA TEST. All rights reserved.
        </footer>

    </main>
);


}

export default ResultPage;
