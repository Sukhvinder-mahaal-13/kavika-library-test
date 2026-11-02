import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Register.css";

function Register() {
const navigate = useNavigate();



const [mode, setMode] = useState("register");
const [checkingSession, setCheckingSession] = useState(true);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const [formData, setFormData] = useState({
    name: "",
    address: "",
    mobile: "",
    password: "",
    confirmPassword: ""
});

// =====================================
// CHECK EXISTING USER SESSION
// =====================================

useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
        try {
            const response = await API.get("/users/me");

            if (isMounted && response.data.success) {
                navigate("/waiting-room", { replace: true });
            }
        } catch (error) {
            // No active session: show login/register page.
        } finally {
            if (isMounted) {
                setCheckingSession(false);
            }
        }
    };

    checkSession();

    return () => {
        isMounted = false;
    };
}, [navigate]);

// =====================================
// HANDLE INPUT CHANGE
// =====================================

const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
        ...previousData,
        [name]: value
    }));

    setError("");
};

// =====================================
// SWITCH LOGIN / REGISTER
// =====================================

const switchMode = (selectedMode) => {
    setMode(selectedMode);
    setError("");

    setFormData({
        name: "",
        address: "",
        mobile: "",
        password: "",
        confirmPassword: ""
    });
};

// =====================================
// HANDLE FORM SUBMIT
// =====================================

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const mobile = formData.mobile.trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
    }

    if (!formData.password) {
        setError("Please enter your password.");
        return;
    }

    if (mode === "register") {
        if (
            !formData.name.trim() ||
            !formData.address.trim()
        ) {
            setError("Please fill in all fields.");
            return;
        }

        if (formData.name.trim().length < 2) {
            setError("Name must contain at least 2 characters.");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Password and confirm password do not match.");
            return;
        }
    }

    try {
        setLoading(true);

        let response;

        if (mode === "register") {
            response = await API.post("/users/register", {
                name: formData.name.trim(),
                address: formData.address.trim(),
                mobile,
                password: formData.password
            });
        } else {
            response = await API.post("/users/login", {
                mobile,
                password: formData.password
            });
        }

        if (response.data.success) {
            navigate("/waiting-room", { replace: true });
        } else {
            setError(
                response.data.message ||
                "Something went wrong. Please try again."
            );
        }

    } catch (error) {
        console.error(`${mode} error:`, error);

        setError(
            error.response?.data?.message ||
            `${mode === "register" ? "Registration" : "Login"} failed. Please try again.`
        );

    } finally {
        setLoading(false);
    }
};

// =====================================
// SESSION CHECK LOADING
// =====================================

if (checkingSession) {
    return (
        <main className="register-page">
            <section className="register-card">
                <div className="register-brand">
                    <div className="brand-logo">K</div>

                    <div>
                        <h1>KAVIKA<span> TEST</span></h1>
                        <p>Online Examination Portal</p>
                    </div>
                </div>

                <div className="register-heading">
                    <h2>Checking your session...</h2>
                    <p>Please wait a moment.</p>
                </div>
            </section>
        </main>
    );
}

return (
    <main className="register-page">

        <div className="register-background">
            <div className="register-glow register-glow-one"></div>
            <div className="register-glow register-glow-two"></div>
        </div>

        <section className="register-card">

            <div className="register-brand">
                <div className="brand-logo">K</div>

                <div>
                    <h1>KAVIKA<span> TEST</span></h1>
                    <p>Online Examination Portal</p>
                </div>
            </div>

            <div className="register-heading">
                <span className="register-badge">
                    {mode === "register" ? "STUDENT REGISTRATION" : "STUDENT LOGIN"}
                </span>

                <h2>
                    {mode === "register"
                        ? "Welcome, Student!"
                        : "Welcome Back!"}
                </h2>

                <p>
                    {mode === "register"
                        ? "Create your account to join the upcoming test."
                        : "Login using your registered mobile number."}
                </p>
            </div>

            {/* LOGIN / REGISTER SWITCH */}

            <div className="auth-mode-switch">
                <button
                    type="button"
                    className={mode === "register" ? "active" : ""}
                    onClick={() => switchMode("register")}
                    disabled={loading}
                >
                    Register
                </button>

                <button
                    type="button"
                    className={mode === "login" ? "active" : ""}
                    onClick={() => switchMode("login")}
                    disabled={loading}
                >
                    Login
                </button>
            </div>

            <form onSubmit={handleSubmit}>

                {mode === "register" && (
                    <>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>

                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                maxLength={50}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">Address</label>

                            <textarea
                                id="address"
                                name="address"
                                placeholder="Enter your complete address"
                                value={formData.address}
                                onChange={handleChange}
                                maxLength={200}
                                rows="3"
                                autoComplete="street-address"
                                required
                            />
                        </div>
                    </>
                )}

                <div className="form-group">
                    <label htmlFor="mobile">Mobile Number</label>

                    <input
                        type="tel"
                        id="mobile"
                        name="mobile"
                        placeholder="Enter 10-digit mobile number"
                        value={formData.mobile}
                        onChange={handleChange}
                        maxLength={10}
                        inputMode="numeric"
                        autoComplete="tel"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>

                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete={
                            mode === "register"
                                ? "new-password"
                                : "current-password"
                        }
                        required
                    />
                </div>

                {mode === "register" && (
                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                        />
                    </div>
                )}

                {error && (
                    <div className="register-error" role="alert">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="register-submit"
                    disabled={loading}
                >
                    {loading
                        ? "Please Wait..."
                        : mode === "register"
                            ? "Register & Continue"
                            : "Login & Continue"}

                    <span>→</span>
                </button>

            </form>

            <div className="register-footer">
                <span>🔒</span>
                Your information is securely stored.
            </div>

        </section>

        <div className="register-copyright">
            <span>
                © {new Date().getFullYear()} KAVIKA TEST. All rights reserved.
            </span>

            <div className="developer-credit">
                Website designed & developed by
                <strong> Sukhi </strong>

                <a
                    href="https://sukhvinder-portfolio.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="developer-link"
                    aria-label="Visit Sukhi's portfolio"
                >
                    Click here <span>→</span>
                </a>
            </div>
        </div>

    </main>
);


}

export default Register;
