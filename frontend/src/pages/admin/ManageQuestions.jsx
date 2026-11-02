import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import "./ManageQuestions.css";

function ManageQuestions() {
const { testId } = useParams();
const navigate = useNavigate();


const [test, setTest] = useState(null);
const [questions, setQuestions] = useState([]);
const [questionText, setQuestionText] = useState("");
const [options, setOptions] = useState(["", "", "", ""]);
const [correctAnswer, setCorrectAnswer] = useState(0);
const [marks, setMarks] = useState(1);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

useEffect(() => {
    const loadQuestions = async () => {
        try {
            const [testResponse, questionsResponse] = await Promise.all([
                API.get(`/tests/${testId}`),
                API.get(`/tests/${testId}/questions`)
            ]);

            setTest(testResponse.data.test);
            setQuestions(questionsResponse.data.questions || []);

        } catch (error) {
            if (error.response?.status === 401) {
                navigate("/admin", { replace: true });
                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to load test questions."
            );

        } finally {
            setLoading(false);
        }
    };

    loadQuestions();
}, [testId, navigate]);

const handleOptionChange = (index, value) => {
    setOptions((previous) =>
        previous.map((option, i) =>
            i === index ? value : option
        )
    );
};

const addOption = () => {
    if (options.length >= 6) return;
    setOptions((previous) => [...previous, ""]);
};

const removeOption = (index) => {
    if (options.length <= 2) return;

    setOptions((previous) =>
        previous.filter((_, i) => i !== index)
    );

    setCorrectAnswer((previous) => {
        if (previous === index) return 0;
        if (previous > index) return previous - 1;
        return previous;
    });
};

const resetForm = () => {
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setMarks(1);
    setError("");
    setSuccess("");
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanOptions = options.map((option) => option.trim());

    if (!questionText.trim()) {
        setError("Please enter the question.");
        return;
    }

    if (cleanOptions.some((option) => !option)) {
        setError("Please fill in all options.");
        return;
    }

    if (new Set(cleanOptions).size !== cleanOptions.length) {
        setError("Options must not contain duplicate answers.");
        return;
    }

    if (
        !Number.isInteger(Number(marks)) ||
        Number(marks) < 1 ||
        Number(marks) > 100
    ) {
        setError("Marks must be between 1 and 100.");
        return;
    }

    try {
        setSaving(true);

        const response = await API.post(
            `/tests/${testId}/questions`,
            {
                questionText: questionText.trim(),
                options: cleanOptions,
                correctAnswer,
                marks: Number(marks)
            }
        );

        if (response.data.success) {
            setQuestions((previous) => [
                ...previous,
                response.data.question
            ]);

            setSuccess("Question added successfully!");
            resetForm();
        }

    } catch (error) {
        if (error.response?.status === 401) {
            navigate("/admin", { replace: true });
            return;
        }

        setError(
            error.response?.data?.message ||
            "Unable to save question. Please try again."
        );

    } finally {
        setSaving(false);
    }
};

if (loading) {
    return (
        <div className="manage-questions-loading">
            <div className="manage-questions-spinner"></div>
            <p>Loading questions...</p>
        </div>
    );
}

return (
    <main className="manage-questions-page">

        <aside className="manage-questions-sidebar">

            <div className="manage-questions-brand">
                <div className="manage-questions-logo">K</div>
                <div>
                    <h2>KAVIKA</h2>
                    <span>ADMIN PANEL</span>
                </div>
            </div>

            <nav className="manage-questions-nav">
                <p>MAIN MENU</p>

                <Link to="/admin/dashboard" className="manage-questions-nav-link">
                    <span>▦</span> Dashboard
                </Link>

                <Link to="/admin/create-test" className="manage-questions-nav-link">
                    <span>＋</span> Create Test
                </Link>
            </nav>

            <div className="manage-questions-sidebar-footer">
                🔒 Secure Administration
            </div>

        </aside>

        <section className="manage-questions-main">

            <header className="manage-questions-header">
                <div>
                    <span className="manage-questions-eyebrow">
                        QUESTION MANAGEMENT
                    </span>
                    <h1>Manage Questions</h1>
                    <p>Add and manage questions for your examination.</p>
                </div>

                <Link to="/admin/dashboard" className="manage-questions-back-btn">
                    ← Dashboard
                </Link>
            </header>

            {test && (
                <section className="manage-test-info">
                    <div className="manage-test-info-icon">◈</div>

                    <div>
                        <span>SELECTED EXAMINATION</span>
                        <h2>{test.title}</h2>
                        <p>
                            Duration: {test.durationMinutes} Minutes
                            <span> • </span>
                            Questions Added: {questions.length}
                        </p>
                    </div>
                </section>
            )}

            <section className="manage-question-card">

                <div className="manage-question-card-heading">
                    <div className="manage-question-heading-icon">✎</div>
                    <div>
                        <h2>Add New Question</h2>
                        <p>Enter your question and its answer options.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>

                    <div className="manage-question-form-group">
                        <label htmlFor="questionText">
                            Question <span>*</span>
                        </label>

                        <textarea
                            id="questionText"
                            placeholder="Write your question here..."
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            rows="4"
                            required
                        />
                    </div>

                    <div className="manage-options-heading">
                        <div>
                            <h3>Answer Options</h3>
                            <p>Select the radio button beside the correct answer.</p>
                        </div>
                        <span>{options.length}/6 Options</span>
                    </div>

                    <div className="manage-options-list">
                        {options.map((option, index) => (
                            <div
                                className={`manage-option-row ${
                                    correctAnswer === index ? "correct-option" : ""
                                }`}
                                key={index}
                            >
                                <label className="manage-option-radio">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={correctAnswer === index}
                                        onChange={() => setCorrectAnswer(index)}
                                    />
                                    <span></span>
                                </label>

                                <div className="manage-option-letter">
                                    {String.fromCharCode(65 + index)}
                                </div>

                                <input
                                    type="text"
                                    className="manage-option-input"
                                    placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                                    value={option}
                                    onChange={(e) =>
                                        handleOptionChange(index, e.target.value)
                                    }
                                    maxLength={200}
                                    required
                                />

                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        className="manage-remove-option"
                                        onClick={() => removeOption(index)}
                                        aria-label="Remove option"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="manage-add-option-btn"
                        onClick={addOption}
                        disabled={options.length >= 6}
                    >
                        ＋ Add Another Option
                    </button>

                    <div className="manage-correct-answer-notice">
                        <span>✓</span>
                        The selected option will be saved as the correct answer.
                    </div>

                    <div className="manage-question-form-group manage-marks-group">
                        <label htmlFor="marks">Marks for this question</label>
                        <input
                            type="number"
                            id="marks"
                            min="1"
                            max="100"
                            step="1"
                            value={marks}
                            onChange={(e) => setMarks(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="manage-question-error">
                            <span>!</span> {error}
                        </div>
                    )}

                    {success && (
                        <div className="manage-question-success">
                            <span>✓</span> {success}
                        </div>
                    )}

                    <div className="manage-question-actions">
                        <button
                            type="button"
                            className="manage-reset-btn"
                            onClick={resetForm}
                        >
                            Reset Form
                        </button>

                        <button
                            type="submit"
                            className="manage-save-question-btn"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Question"}
                            <span>→</span>
                        </button>
                    </div>

                </form>
            </section>

            <section className="manage-existing-questions">

                <div className="manage-existing-heading">
                    <div>
                        <h2>Added Questions</h2>
                        <p>Questions already added to this examination.</p>
                    </div>
                    <span>{questions.length} Questions</span>
                </div>

                {questions.length === 0 ? (
                    <div className="manage-questions-empty">
                        <div>▤</div>
                        <h3>No Questions Added Yet</h3>
                        <p>Your questions will appear here after saving.</p>
                    </div>
                ) : (
                    <div className="manage-existing-list">
                        {questions.map((question, index) => (
                            <article
                                className="manage-existing-question"
                                key={question._id || index}
                            >
                                <div className="manage-existing-number">
                                    {index + 1}
                                </div>

                                <div className="manage-existing-content">
                                    <h3>{question.questionText}</h3>

                                    <div className="manage-existing-options">
                                        {question.options.map((option, optionIndex) => (
                                            <span key={optionIndex}>
                                                {String.fromCharCode(65 + optionIndex)}. {option}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <span className="manage-existing-marks">
                                    {question.marks || 1} Marks
                                </span>
                            </article>
                        ))}
                    </div>
                )}

            </section>

            <footer className="manage-questions-footer">
                © {new Date().getFullYear()} KAVIKA TEST. All rights reserved.
            </footer>

        </section>
    </main>
);


}

export default ManageQuestions;
