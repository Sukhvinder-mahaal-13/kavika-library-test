import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./CreateTest.css";

function CreateTest() {
const navigate = useNavigate();


const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    durationMinutes: "30",
    accessKey: ""
});

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
        ...previousData,
        [name]: value
    }));
};

const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const {
        title,
        description,
        date,
        time,
        durationMinutes,
        accessKey
    } = formData;

    if (
        !title.trim() ||
        !date ||
        !time ||
        !durationMinutes ||
        !accessKey.trim()
    ) {
        setError("Please fill in all required fields.");
        return;
    }

    if (accessKey.trim().length < 4) {
        setError("Access Key must contain at least 4 characters.");
        return;
    }

    const scheduledStartAt = new Date(`${date}T${time}`);

    if (
        Number.isNaN(scheduledStartAt.getTime()) ||
        scheduledStartAt <= new Date()
    ) {
        setError("Please select a future date and time.");
        return;
    }

    try {
        setLoading(true);

        const response = await API.post("/tests", {
            title: title.trim(),
            description: description.trim(),
            scheduledStartAt: scheduledStartAt.toISOString(),
            durationMinutes: Number(durationMinutes),
            accessKey: accessKey.trim()
        });

        if (response.data.success) {
            setSuccess("Test created successfully!");

            setTimeout(() => {
                navigate("/admin/dashboard");
            }, 1200);
        }
    } catch (error) {
        if (error.response?.status === 401) {
            navigate("/admin", { replace: true });
            return;
        }

        setError(
            error.response?.data?.message ||
            "Unable to create test. Please try again."
        );
    } finally {
        setLoading(false);
    }
};

return (
    <main className="create-test-page">

        {/* Sidebar */}
        <aside className="create-test-sidebar">

            <div className="create-test-brand">
                <div className="create-test-logo">K</div>

                <div>
                    <h2>KAVIKA</h2>
                    <span>ADMIN PANEL</span>
                </div>
            </div>

            <nav className="create-test-nav">

                <p>MAIN MENU</p>

                <Link
                    to="/admin/dashboard"
                    className="create-test-nav-link"
                >
                    <span>▦</span>
                    Dashboard
                </Link>

                <Link
                    to="/admin/create-test"
                    className="create-test-nav-link active"
                >
                    <span>＋</span>
                    Create Test
                </Link>

            </nav>

            <div className="create-test-sidebar-footer">
                <span>🔒</span>
                Secure Administration
            </div>

        </aside>

        {/* Main Content */}
        <section className="create-test-main">

            {/* Header */}
            <header className="create-test-header">

                <div>
                    <span className="create-test-eyebrow">
                        EXAMINATION MANAGEMENT
                    </span>

                    <h1>Create New Test</h1>

                    <p>
                        Configure a new examination for your participants.
                    </p>
                </div>

                <Link
                    to="/admin/dashboard"
                    className="create-test-back-btn"
                >
                    ← Back to Dashboard
                </Link>

            </header>

            {/* Form Card */}
            <section className="create-test-card">

                <div className="create-test-card-heading">

                    <div className="create-test-heading-icon">
                        ✎
                    </div>

                    <div>
                        <h2>Test Information</h2>
                        <p>
                            Enter the basic details of your examination.
                        </p>
                    </div>

                </div>

                <form onSubmit={handleSubmit}>

                    {/* Test Title */}
                    <div className="create-test-form-group">

                        <label htmlFor="title">
                            Test Title <span>*</span>
                        </label>

                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="e.g. Full Stack Developer Test"
                            value={formData.title}
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />

                        <small>
                            Maximum 100 characters.
                        </small>

                    </div>

                    {/* Description */}
                    <div className="create-test-form-group">

                        <label htmlFor="description">
                            Test Description
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            placeholder="Enter a short description about this examination..."
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            maxLength={500}
                        />

                        <small>
                            Optional. Maximum 500 characters.
                        </small>

                    </div>

                    {/* Date and Time */}
                    <div className="create-test-two-columns">

                        <div className="create-test-form-group">

                            <label htmlFor="date">
                                Test Date <span>*</span>
                            </label>

                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                min={new Date().toLocaleDateString("en-CA")}
                                required
                            />

                        </div>

                        <div className="create-test-form-group">

                            <label htmlFor="time">
                                Starting Time <span>*</span>
                            </label>

                            <input
                                type="time"
                                id="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                required
                            />

                        </div>

                    </div>

                    {/* Duration */}
                    <div className="create-test-form-group">

                        <label htmlFor="durationMinutes">
                            Test Duration <span>*</span>
                        </label>

                        <select
                            id="durationMinutes"
                            name="durationMinutes"
                            value={formData.durationMinutes}
                            onChange={handleChange}
                            required
                        >
                            <option value="15">15 Minutes</option>
                            <option value="30">30 Minutes</option>
                            <option value="40">40 Minutes</option>
                            <option value="60">60 Minutes</option>
                            <option value="90">90 Minutes</option>
                            <option value="120">120 Minutes</option>
                            <option value="180">180 Minutes</option>
                            <option value="300">300 Minutes</option>
                        </select>

                        <small>
                            The examination will automatically end when
                            the selected duration expires.
                        </small>

                    </div>

                    {/* Access Key */}
                    <div className="create-test-form-group">

                        <label htmlFor="accessKey">
                            Test Access Key <span>*</span>
                        </label>

                        <input
                            type="password"
                            id="accessKey"
                            name="accessKey"
                            placeholder="Create a key for participants"
                            value={formData.accessKey}
                            onChange={handleChange}
                            minLength={4}
                            maxLength={50}
                            autoComplete="new-password"
                            required
                        />

                        <small>
                            Minimum 4 characters. Participants must enter
                            this key in the Waiting Room to unlock the test.
                            Keep this key private.
                        </small>

                    </div>

                    {/* Test Preview */}
                    <div className="create-test-preview">

                        <div className="create-test-preview-icon">
                            ◷
                        </div>

                        <div>
                            <h3>Examination Schedule</h3>

                            <p>
                                {formData.date && formData.time
                                    ? `${formData.date} at ${formData.time}`
                                    : "Select a date and time to schedule your test."}
                            </p>

                            <span>
                                Duration: {formData.durationMinutes} minutes
                            </span>
                        </div>

                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="create-test-error">
                            <span>!</span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="create-test-success">
                            <span>✓</span>
                            {success}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="create-test-actions">

                        <Link
                            to="/admin/dashboard"
                            className="create-test-cancel-btn"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="create-test-submit-btn"
                            disabled={loading}
                        >
                            {loading ? "Creating Test..." : "Create Test"}
                            <span>→</span>
                        </button>

                    </div>

                </form>

            </section>

            <footer className="create-test-footer">
                © {new Date().getFullYear()} KAVIKA TEST. All rights reserved.
            </footer>

        </section>

    </main>
);


}

export default CreateTest;
