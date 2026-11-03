
const User = require("../models/User");

const isUserAuthenticated = async (req, res, next) => {
    try {
        // =====================================
        // SESSION DEBUGGING
        // =====================================

        const userId = req.session?.userId;

        console.log("========== USER AUTH DEBUG ==========");

        console.log("Request URL:", req.originalUrl);
        console.log("Request Method:", req.method);

        console.log("Session Exists:", !!req.session);
        console.log("Session ID Exists:", !!req.sessionID);

        console.log("Cookie Received:", !!req.headers.cookie);
        console.log("User ID Exists:", !!userId);

        console.log("=====================================");

        // =====================================
        // CHECK USER SESSION
        // =====================================

        if (!userId) {
            console.log("AUTH RESULT: User session missing.");

            return res.status(401).json({
                success: false,
                message: "Please login to continue."
            });
        }

        // =====================================
        // FIND USER IN DATABASE
        // =====================================

        const user = await User.findById(userId);

        if (!user || user.isArchived === true) {
            console.log(
                "AUTH RESULT:",
                user
                    ? "User account is archived."
                    : "User account not found."
            );

            return req.session.destroy((error) => {
                if (error) {
                    console.error("Session Destroy Error:", error);
                }

                res.clearCookie("kavika.sid", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "none",
                    path: "/"
                });

                return res.status(401).json({
                    success: false,
                    message: user
                        ? "Your account has been archived. Please contact the administrator."
                        : "User account not found. Please login again."
                });
            });
        }

        // =====================================
        // AUTHENTICATED USER
        // =====================================

        req.user = user;

        console.log("AUTH RESULT: User authenticated successfully.");

        return next();

    } catch (error) {
        console.error("User Authentication Error:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication failed."
        });
    }
};

module.exports = isUserAuthenticated;

