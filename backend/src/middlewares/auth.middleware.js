
const User = require("../models/User");

const isUserAuthenticated = async (req, res, next) => {
    try {
        const userId = req.session?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to continue."
            });
        }

        const user = await User.findById(userId);

        if (!user || user.isArchived === true) {
            return req.session.destroy(() => {
                res.clearCookie("kavika.sid");

                return res.status(401).json({
                    success: false,
                    message: user
                        ? "Your account has been archived. Please contact the administrator."
                        : "User account not found. Please login again."
                });
            });
        }

        req.user = user;

        next();

    } catch (error) {
        console.error("User Authentication Error:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication failed."
        });
    }
};

module.exports = isUserAuthenticated;
