import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import "./TestPage.css";

function TestPage() {
const { testId } = useParams();
const navigate = useNavigate();


const [test, setTest] = useState(null);
const [questions, setQuestions] = useState([]);
const [currentQuestion, setCurrentQuestion] = useState(0);
const [answers, setAnswers] = useState({});
const [timeLeft, setTimeLeft] = useState(null);
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");
const [showSubmitModal, setShowSubmitModal] = useState(false);

// Load test questions
useEffect(() => {
    let isMounted = true;

    const loadTest = async () => {
        try {
            const response = await API.get(
                `/tests/${testId}/questions/student`
            );

            const data = response.data;

            if (!data.success) {
                throw new Error("Unable to load test.");
            }

            if (!isMounted) return;

            setTest(data.test);
            setQuestions(data.questions || []);
            setTimeLeft(data.remainingSeconds ?? null);

        } catch (error) {
            if (!isMounted) return;

            if (error.response?.status === 401) {
                navigate("/");
                return;
            }

            setError(
                error.response?.data?.message ||
                error.message ||
                "Unable to load test questions."
            );

        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    };

    loadTest();

    return () => {
        isMounted = false;
    };
}, [testId, navigate]);

// Submit test
const submitTest = useCallback(async (automatic = false) => {
    if (submitting) return;

    try {
        setSubmitting(true);
        setError("");
        setShowSubmitModal(false);

        const submittedAnswers = Object.entries(answers).map(
            ([questionId, selectedAnswer]) => ({
                question: questionId,
                selectedAnswer
            })
        );

        const response = await API.post(
            `/results/${testId}/submit`,
            {
                answers: submittedAnswers,
                automatic
            }
        );

        if (response.data.success) {
            navigate(`/result/${testId}`, {
                replace: true
            });
        } else {
            throw new Error(
                response.data.message || "Test submission failed."
            );
        }

    } catch (error) {
        setError(
            error.response?.data?.message ||
            error.message ||
            "Test submission failed. Please try again."
        );

        setSubmitting(false);
    }
}, [answers, testId, navigate, submitting]);

// Countdown timer
useEffect(() => {
    if (timeLeft === null || submitting) return;

    if (timeLeft <= 0) {
        submitTest(true);
        return;
    }

    const timer = setTimeout(() => {
        setTimeLeft(previousTime => previousTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
}, [timeLeft, submitting, submitTest]);

// Select answer
const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers(previousAnswers => ({
        ...previousAnswers,
        [questionId]: optionIndex
    }));
};

// Navigate questions
const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
        setCurrentQuestion(index);
    }
};

// Format countdown
const formatTime = (seconds) => {
    if (seconds === null) return "--:--";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
};

// Loading screen
if (loading) {
    return (
        <div className="test-loading">
            <div className="test-spinner"></div>
            <p>Loading your examination...</p>
        </div>
    );
}

// Error screen
if (error && questions.length === 0) {
    return (
        <div className="test-error">
            <h2>Unable to Start Test</h2>
            <p>{error}</p>

            <button onClick={() => navigate("/waiting-room")}>
                Back to Waiting Room
            </button>
        </div>
    );
}

if (!test || questions.length === 0) {
    return (
        <div className="test-error">
            <h2>No Questions Available</h2>
            <p>This test does not have any questions yet.</p>
        </div>
    );
}

const question = questions[currentQuestion];
const answeredCount = Object.keys(answers).length;
const unansweredCount = questions.length - answeredCount;
const progress = (answeredCount / questions.length) * 100;

return (
    <main className="test-page">

        <header className="test-header">

            <div className="test-brand">
                <div className="test-logo">K</div>

                <div>
                    <h2>KAVIKA TEST</h2>
                    <span>Online Examination</span>
                </div>
            </div>

            <div className="test-header-title">
                <h3>{test.title}</h3>
                <span>{questions.length} Questions</span>
            </div>

            <div className="test-timer">
                <span>TIME LEFT</span>

                <strong className={
                    timeLeft !== null && timeLeft <= 300
                        ? "timer-warning"
                        : ""
                }>
                    {formatTime(timeLeft)}
                </strong>
            </div>

        </header>

        <section className="test-progress-section">

            <div className="test-progress-info">
                <span>Test Progress</span>

                <strong>
                    {answeredCount}/{questions.length} Answered
                </strong>
            </div>

            <div className="test-progress-track">
                <div
                    className="test-progress-fill"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

        </section>

        <section className="test-layout">

            <div className="test-question-area">

                <div className="test-question-top">

                    <span className="question-number">
                        QUESTION {currentQuestion + 1}
                    </span>

                    <span className="question-marks">
                        {question.marks || 1} Mark
                    </span>

                </div>

                <h2 className="test-question-text">
                    {question.questionText}
                </h2>

                <p className="test-instruction">
                    Select one correct answer from the options below.
                </p>

                <div className="test-options">

                    {question.options.map((option, index) => {
                        const isSelected =
                            answers[question._id] === index;

                        return (
                            <button
                                key={index}
                                type="button"
                                className={`test-option ${
                                    isSelected ? "selected" : ""
                                }`}
                                onClick={() =>
                                    handleAnswerSelect(
                                        question._id,
                                        index
                                    )
                                }
                                disabled={submitting}
                            >
                                <span className="option-letter">
                                    {String.fromCharCode(65 + index)}
                                </span>

                                <span className="option-text">
                                    {option}
                                </span>

                                <span className="option-check">
                                    {isSelected ? "✓" : ""}
                                </span>
                            </button>
                        );
                    })}

                </div>

                <div className="test-navigation">

                    <button
                        type="button"
                        className="test-prev-btn"
                        onClick={() =>
                            goToQuestion(currentQuestion - 1)
                        }
                        disabled={currentQuestion === 0 || submitting}
                    >
                        ← Previous
                    </button>

                    {currentQuestion < questions.length - 1 ? (
                        <button
                            type="button"
                            className="test-next-btn"
                            onClick={() =>
                                goToQuestion(currentQuestion + 1)
                            }
                            disabled={submitting}
                        >
                            Next Question →
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="test-submit-btn"
                            onClick={() => setShowSubmitModal(true)}
                            disabled={submitting}
                        >
                            Submit Test
                        </button>
                    )}

                </div>

            </div>

            <aside className="test-sidebar">

                <div className="test-sidebar-heading">
                    <h3>Question Palette</h3>
                    <p>Navigate between questions</p>
                </div>

                <div className="question-legend">

                    <span>
                        <i className="legend-answered"></i>
                        Answered
                    </span>

                    <span>
                        <i className="legend-unanswered"></i>
                        Unanswered
                    </span>

                </div>

                <div className="question-grid">

                    {questions.map((item, index) => {
                        const isAnswered =
                            answers[item._id] !== undefined;

                        return (
                            <button
                                type="button"
                                key={item._id}
                                className={`
                                    question-grid-btn
                                    ${isAnswered ? "answered" : ""}
                                    ${currentQuestion === index ? "active" : ""}
                                `}
                                onClick={() => goToQuestion(index)}
                                disabled={submitting}
                            >
                                {index + 1}
                            </button>
                        );
                    })}

                </div>

                <div className="test-sidebar-stats">

                    <div>
                        <span>Answered</span>
                        <strong>{answeredCount}</strong>
                    </div>

                    <div>
                        <span>Unanswered</span>
                        <strong>{unansweredCount}</strong>
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>{questions.length}</strong>
                    </div>

                </div>

                <button
                    type="button"
                    className="sidebar-submit-btn"
                    onClick={() => setShowSubmitModal(true)}
                    disabled={submitting}
                >
                    Submit Examination
                </button>

            </aside>

        </section>

        {error && (
            <div className="test-submit-error">
                {error}
            </div>
        )}

        {showSubmitModal && (
            <div className="submit-modal-overlay">

                <div className="submit-modal">

                    <div className="submit-modal-icon">!</div>

                    <h2>Submit Your Test?</h2>

                    <p>
                        You have answered {answeredCount} out of{" "}
                        {questions.length} questions.
                    </p>

                    {unansweredCount > 0 && (
                        <div className="unanswered-warning">
                            {unansweredCount} questions are still unanswered.
                        </div>
                    )}

                    <div className="submit-modal-actions">

                        <button
                            type="button"
                            className="cancel-submit-btn"
                            onClick={() => setShowSubmitModal(false)}
                            disabled={submitting}
                        >
                            Continue Test
                        </button>

                        <button
                            type="button"
                            className="confirm-submit-btn"
                            onClick={() => submitTest(false)}
                            disabled={submitting}
                        >
                            {submitting ? "Submitting..." : "Yes, Submit"}
                        </button>

                    </div>

                </div>

            </div>
        )}

    </main>
);


}

export default TestPage;
