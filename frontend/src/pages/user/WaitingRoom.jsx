import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import socket from "../../services/socket";
import "./WaitingRoom.css";

// =====================================
// MOTIVATIONAL THOUGHTS
// =====================================

const motivationalThoughts = [
{
title: "Your Future Is in Your Hands",
message:
"Cheating karke aap aaj test mein achhe marks la sakte hain, lekin apne future ko behtar banane ke liye aapko khud seekhna hoga.",
author: "KAVIKA Motivation"
},
{
title: "Be Honest With Yourself",
message:
"Khud se imaandari rakho. Aapko duniya ko nahi, sabse pehle khud ko prove karna hai.",
author: "KAVIKA Motivation"
},
{
title: "Marks Are Not Everything",
message:
"Cheating karke 100% laane se achha hai apni mehnat se 60% lana. Kyunki asli jeet aapki knowledge hai.",
author: "KAVIKA Motivation"
},
{
title: "Think About Your Future",
message:
"Aaj test mein cheating karke Rank 1 aa bhi gaye, toh kal interview aur real life ki challenges ka saamna kaise karoge?",
author: "KAVIKA Motivation"
},
{
title: "Learn From Your Mistakes",
message:
"Galti karna buri baat nahi hai. Galti se seekhne ke bajay cheating karke use chhupana aapki progress rok sakta hai.",
author: "KAVIKA Motivation"
},
{
title: "Believe In Yourself",
message:
"Doosron ke answers dekhne ke bajay apne dimaag par bharosa rakho. Aap jitna sochte hain, usse zyada kar sakte hain.",
author: "KAVIKA Motivation"
},
{
title: "Success Needs Hard Work",
message:
"Safalta ka koi shortcut nahi hota. Mehnat, practice aur patience hi aapko apne lakshya tak pahunchate hain.",
author: "KAVIKA Motivation"
},
{
title: "Don't Cheat Your Own Future",
message:
"Cheating se aap kisi teacher ko nahi, balki khud ko dhokha dete hain. Aaj ki imaandari kal aapki taakat banegi.",
author: "KAVIKA Motivation"
},
{
title: "Every Question Is An Opportunity",
message:
"Har question aapko kuch naya seekhne ka mauka deta hai. Darne ke bajay poori koshish karo.",
author: "KAVIKA Motivation"
},
{
title: "Compete With Yourself",
message:
"Aapka asli competition kisi doosre student se nahi, balki aapke kal wale version se hai.",
author: "KAVIKA Motivation"
},
{
title: "Honesty Builds Character",
message:
"Aapke marks aapki performance batate hain, lekin aapki imaandari aapka character dikhati hai.",
author: "KAVIKA Motivation"
},
{
title: "One Step At A Time",
message:
"Har bada sapna chhote-chhote steps se poora hota hai. Aaj apna best do aur kal aur behtar bano.",
author: "KAVIKA Motivation"
},
{
title: "Don't Be Afraid Of Failure",
message:
"Kam marks aana aapki haar nahi hai. Haar tab hoti hai jab aap seekhna aur koshish karna chhod dete hain.",
author: "KAVIKA Motivation"
},
{
title: "Earn Your Success",
message:
"Jo result aap apni mehnat se hasil karte hain, uski khushi kisi shortcut se mile result se kahin zyada hoti hai.",
author: "KAVIKA Motivation"
},
{
title: "Your Knowledge Is Your Power",
message:
"Aaj jo knowledge aap hasil karenge, wahi kal aapko naye opportunities aur behtar future ki taraf lekar jayegi.",
author: "KAVIKA Motivation"
}
];

function WaitingRoom() {
const navigate = useNavigate();


const [test, setTest] = useState(null);
const [participants, setParticipants] = useState(0);
const [timeLeft, setTimeLeft] = useState(null);

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [thoughtIndex, setThoughtIndex] = useState(0);

// Access Key states
const [accessKey, setAccessKey] = useState("");
const [accessError, setAccessError] = useState("");
const [unlocking, setUnlocking] = useState(false);
const [testReady, setTestReady] = useState(false);

const hasNavigated = useRef(false);

// =====================================
// CHANGE MOTIVATIONAL THOUGHT
// =====================================

useEffect(() => {
    const thoughtInterval = setInterval(() => {
        setThoughtIndex((previousIndex) =>
            (previousIndex + 1) % motivationalThoughts.length
        );
    }, 10000);

    return () => {
        clearInterval(thoughtInterval);
    };
}, []);

const currentThought = motivationalThoughts[thoughtIndex];

// =====================================
// WAITING ROOM LOGIC
// =====================================

useEffect(() => {
    let countdownInterval;
    let isMounted = true;

    const loadWaitingRoom = async () => {
        try {
            // Step 1: Verify registered user session
            await API.get("/users/me");

            // Step 2: Get upcoming test
            const response = await API.get("/tests/upcoming");

            if (!isMounted) return;

            const upcomingTest = response.data.test;

            if (!upcomingTest) {
                setError("No upcoming test is available right now.");
                setLoading(false);
                return;
            }

            setTest(upcomingTest);

            setParticipants(
                response.data.totalParticipants || 0
            );

            // Step 3: If test is already live,
            // show Access Key form.
            if (upcomingTest.status === "live") {
                setTestReady(true);
                setLoading(false);
                return;
            }

            setLoading(false);

            // Step 4: Register socket listeners.
            const handleParticipantCount = (data) => {
                if (!isMounted) return;

                setParticipants(
                    data.totalParticipants || 0
                );
            };

            const handleTestStarted = (data) => {
                if (
                    data.testId === upcomingTest._id &&
                    isMounted
                ) {
                    clearInterval(countdownInterval);
                    setTimeLeft(0);
                    setTestReady(true);
                }
            };

            socket.on(
                "participant-count-updated",
                handleParticipantCount
            );

            socket.on(
                "test-started",
                handleTestStarted
            );

            socket.connect();

            socket.emit(
                "join-waiting-room",
                upcomingTest._id
            );

            // Step 5: Countdown.
            // When countdown completes, Access Key is required.

            const updateCountdown = () => {
                if (!isMounted || hasNavigated.current) {
                    return;
                }

                const startTime = new Date(
                    upcomingTest.scheduledStartAt
                ).getTime();

                const difference = startTime - Date.now();

                if (difference <= 0) {
                    setTimeLeft(0);
                    setTestReady(true);

                    clearInterval(countdownInterval);
                    return;
                }

                setTimeLeft(difference);
            };

            updateCountdown();

            countdownInterval = setInterval(
                updateCountdown,
                1000
            );

        } catch (error) {
            console.error("Waiting Room Error:", error);

            if (!isMounted) return;

            if (error.response?.status === 401) {
                navigate("/");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to load waiting room. Please try again."
            );

            setLoading(false);
        }
    };

    loadWaitingRoom();

    return () => {
        isMounted = false;

        clearInterval(countdownInterval);

        socket.off("participant-count-updated");
        socket.off("test-started");

        socket.disconnect();
    };

}, [navigate]);

// =====================================
// UNLOCK TEST WITH ACCESS KEY
// =====================================

const handleUnlockTest = async (e) => {
    e.preventDefault();

    setAccessError("");

    if (!accessKey.trim()) {
        setAccessError("Please enter the Test Access Key.");
        return;
    }

    if (!test?._id) {
        setAccessError("Test information is not available.");
        return;
    }

    try {
        setUnlocking(true);

        const response = await API.post(
            `/tests/${test._id}/unlock`,
            {
                accessKey: accessKey.trim()
            }
        );

        if (response.data.success) {
            if (hasNavigated.current) return;

            hasNavigated.current = true;

            socket.off("participant-count-updated");
            socket.off("test-started");
            socket.disconnect();

            navigate(`/test/${test._id}`, {
                replace: true
            });
        }

    } catch (error) {
        if (error.response?.status === 401) {
            navigate("/", { replace: true });
            return;
        }

        setAccessError(
            error.response?.data?.message ||
            "Invalid Access Key. Please try again."
        );

    } finally {
        setUnlocking(false);
    }
};

// =====================================
// FORMAT COUNTDOWN
// =====================================

const formatTime = (milliseconds) => {
    if (milliseconds === null) {
        return "--:--:--";
    }

    const totalSeconds = Math.floor(milliseconds / 1000);

    const days = Math.floor(totalSeconds / 86400);

    const hours = Math.floor(
        (totalSeconds % 86400) / 3600
    );

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    const pad = (number) =>
        String(number).padStart(2, "0");

    if (days > 0) {
        return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// =====================================
// LOADING SCREEN
// =====================================

if (loading) {
    return (
        <div className="waiting-loading">
            <div className="waiting-spinner"></div>
            <p>Preparing your waiting room...</p>
        </div>
    );
}

// =====================================
// ERROR SCREEN
// =====================================

if (error) {
    return (
        <div className="waiting-error">

            <h2>Waiting Room</h2>

            <p>{error}</p>

            <div className="waiting-error-actions">

                <button
                    type="button"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </button>

                <button
                    type="button"
                    className="waiting-results-btn"
                    onClick={() => navigate("/my-results")}
                >
                    My Results
                    <span>→</span>
                </button>

            </div>

        </div>
    );
}

// =====================================
// WAITING ROOM
// =====================================

return (
    <main className="waiting-page">

        <header className="waiting-header">

            <div className="waiting-brand">
                <div className="waiting-logo">K</div>

                <div>
                    <h2>KAVIKA TEST</h2>
                    <span>Online Examination Portal</span>
                </div>
            </div>

            <div className="waiting-live">
                <span></span>
                WAITING ROOM
            </div>

            {/* MY RESULTS BUTTON */}

            <button
                type="button"
                className="waiting-results-btn"
                onClick={() => navigate("/my-results")}
            >
                My Results
                <span>→</span>
            </button>

        </header>

        <section className="waiting-content">

            <div className="waiting-icon">⌛</div>

            <span className="waiting-label">
                YOU ARE SUCCESSFULLY REGISTERED
            </span>

            <h1>
                {testReady ? "Test Is Ready!" : "Get Ready!"}
            </h1>

            <p className="waiting-description">
                {testReady
                    ? "Your examination is ready. Enter the Access Key provided by your administrator to unlock the test."
                    : "Your registration is complete. Please stay on this page. Your test will start automatically."}
            </p>

            {/* UPCOMING TEST */}

            <div className="waiting-test-card">

                <span className="waiting-card-label">
                    UPCOMING EXAMINATION
                </span>

                <h2>{test.title}</h2>

                <div className="waiting-test-info">

                    <div>
                        <span>Test Duration</span>
                        <strong>
                            {test.durationMinutes} Minutes
                        </strong>
                    </div>

                    <div>
                        <span>Participants</span>
                        <strong>{participants}</strong>
                    </div>

                </div>

            </div>

            {/* COUNTDOWN */}

            {!testReady && (
                <div className="waiting-countdown-card">

                    <p>TEST STARTS IN</p>

                    <div className="waiting-countdown">
                        {formatTime(timeLeft)}
                    </div>

                    <span>
                        Please do not close this page.
                    </span>

                </div>
            )}

            {/* ACCESS KEY FORM */}

            {testReady && (
                <div className="waiting-countdown-card">

                    <p>TEST ACCESS VERIFICATION</p>

                    <form onSubmit={handleUnlockTest}>

                        <div className="waiting-access-form-group">

                            <label htmlFor="testAccessKey">
                                Enter Test Access Key
                            </label>

                            <input
                                type="password"
                                id="testAccessKey"
                                name="accessKey"
                                placeholder="Enter your access key"
                                value={accessKey}
                                onChange={(e) => {
                                    setAccessKey(e.target.value);
                                    setAccessError("");
                                }}
                                autoComplete="off"
                                maxLength={50}
                                required
                            />

                        </div>

                        {accessError && (
                            <div className="waiting-access-error">
                                <span>!</span>
                                {accessError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="waiting-access-submit"
                            disabled={unlocking}
                        >
                            {unlocking
                                ? "Verifying Access Key..."
                                : "Unlock & Start Test"}
                            <span>→</span>
                        </button>

                    </form>

                    <span>
                        Your Access Key is required to enter the examination.
                    </span>

                </div>
            )}

            {/* PARTICIPANTS */}

            <div className="waiting-participants">

                <div className="participant-avatars">
                    <span>👤</span>
                    <span>👤</span>
                    <span>👤</span>
                </div>

                <p>
                    <strong>{participants}</strong> participants
                    are waiting for the test.
                </p>

            </div>

            {/* MOTIVATIONAL THOUGHTS */}

            <div className="waiting-motivation">

                <div className="motivation-heading">
                    <span className="motivation-icon">💡</span>

                    <div>
                        <span className="motivation-label">
                            A THOUGHT FOR YOU
                        </span>

                        <h2>Aaj Ka Vichar</h2>
                    </div>
                </div>

                <div
                    className="motivation-content"
                    key={thoughtIndex}
                >
                    <h3>{currentThought.title}</h3>

                    <p>
                        “{currentThought.message}”
                    </p>

                    <span className="motivation-author">
                        — {currentThought.author}
                    </span>
                </div>

                <div className="motivation-dots">
                    {motivationalThoughts.map((thought, index) => (
                        <span
                            key={index}
                            className={
                                index === thoughtIndex
                                    ? "active"
                                    : ""
                            }
                        ></span>
                    ))}
                </div>

            </div>

            {/* NOTICE */}

            <div className="waiting-notice">

                <span>ℹ</span>

                <p>
                    {testReady
                        ? "Enter the correct Access Key to begin your examination."
                        : "When the examination starts, enter the Access Key to unlock the test."}
                </p>

            </div>

        </section>

        {/* FOOTER */}

        <footer className="waiting-footer">

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

        </footer>

    </main>
);


}

export default WaitingRoom;
