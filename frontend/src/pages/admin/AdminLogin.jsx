import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./AdminLogin.css";

function AdminLogin() {
const navigate = useNavigate();


const [formData, setFormData] = useState({
    email: "",
    mobile: "",
    password: ""
});

const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

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

    const email = formData.email.trim();
    const mobile = formData.mobile.trim();
    const password = formData.password;

    if (!email || !mobile || !password) {
        setError("Please fill in all fields.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address.");
        return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
    }

    try {
        setLoading(true);

        const response = await API.post("/admin/login", {
            email,
            mobile,
            password
        });

        if (response.data.success) {
            navigate("/admin/dashboard", {
                replace: true
            });
        }

    } catch (error) {
        setError(
            error.response?.data?.message ||
            "Admin login failed. Please try again."
        );

    } finally {
        setLoading(false);
    }
};

return (
    <main className="admin-login-page">

        <div className="admin-login-background">
            <div className="admin-login-glow admin-glow-one"></div>
            <div className="admin-login-glow admin-glow-two"></div>
        </div>

        <section className="admin-login-card">

            {/* Brand */}
            <div className="admin-login-brand">

                <div className="admin-login-logo">
                    K
                </div>

                <div>
                    <h1>KAVIKA<span> TEST</span></h1>
                    <p>Administration Portal</p>
                </div>

            </div>

            {/* Heading */}
            <div className="admin-login-heading">

                <div className="admin-shield-icon">
                    ♙
                </div>

                <span className="admin-login-label">
                    SECURE ADMIN ACCESS
                </span>

                <h2>Welcome Back!</h2>

                <p>
                    Sign in to manage examinations and participants.
                </p>

            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>

                <div className="admin-form-group">

                    <label htmlFor="email">
                        Email Address
                    </label>

                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter admin email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="username"
                        required
                    />

                </div>

                <div className="admin-form-group">

                    <label htmlFor="mobile">
                        Mobile Number
                    </label>

                    <input
                        type="tel"
                        id="mobile"
                        name="mobile"
                        placeholder="Enter 10-digit mobile number"
                        value={formData.mobile}
                        onChange={handleChange}
                        maxLength={10}
                        inputMode="numeric"
                        required
                    />

                </div>

                <div className="admin-form-group">

                    <label htmlFor="password">
                        Password
                    </label>

                    <div className="admin-password-wrapper">

                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                        />

                        <button
                            type="button"
                            className="admin-password-toggle"
                            onClick={() =>
                                setShowPassword((previous) => !previous)
                            }
                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>

                    </div>

                </div>

                {error && (
                    <div className="admin-login-error">
                        <span>!</span>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="admin-login-submit"
                    disabled={loading}
                >
                    {loading ? "Authenticating..." : "Secure Login"}
                    <span>→</span>
                </button>

            </form>

            {/* Security Notice */}
            <div className="admin-security-notice">
                <span>🔒</span>

                <p>
                    Authorized administrators only.
                    Your session is protected.
                </p>
            </div>

        </section>

        <footer className="admin-login-footer">
            © {new Date().getFullYear()} KAVIKA TEST. All rights reserved.
        </footer>

    </main>
);


}

export default AdminLogin;
