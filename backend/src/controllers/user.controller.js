
const User = require("../models/User");
const bcrypt = require("bcrypt");

// =====================================
// CREATE USER SESSION
// =====================================

const createUserSession = async (req, userId) => {
    await new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) return reject(error);
            resolve();
        });
    });

    req.session.userId = userId.toString();

    await new Promise((resolve, reject) => {
        req.session.save((error) => {
            if (error) return reject(error);
            resolve();
        });
    });
};

// =====================================
// REGISTER USER
// =====================================

const registerUser = async (req, res) => {
    try {
        const { name, address, mobile, password } = req.body;

        if (!name || !address || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const cleanName = name.trim();
        const cleanAddress = address.trim();
        const cleanMobile = mobile.trim();

        if (cleanName.length < 2 || cleanName.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 50 characters."
            });
        }

        if (cleanAddress.length > 200) {
            return res.status(400).json({
                success: false,
                message: "Address cannot exceed 200 characters."
            });
        }

        const mobileRegex = /^[6-9]\d{9}$/;

        if (!mobileRegex.test(cleanMobile)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 10-digit mobile number."
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long."
            });
        }

        const existingUser = await User.findOne({
            mobile: cleanMobile
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.isArchived
                    ? "This account has been archived. Please contact the administrator."
                    : "This mobile number is already registered. Please login."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: cleanName,
            address: cleanAddress,
            mobile: cleanMobile,
            password: hashedPassword,
            isArchived: false,
            archivedAt: null
        });

        await createUserSession(req, user._id);

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            user: {
                id: user._id,
                name: user.name
            }
        });

    } catch (error) {
        console.error("User Registration Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This mobile number is already registered. Please login."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
        });
    }
};

// =====================================
// LOGIN USER
// =====================================

const loginUser = async (req, res) => {
    try {
        const { mobile, password } = req.body;

        if (!mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Mobile number and password are required."
            });
        }

        const cleanMobile = mobile.trim();

        const mobileRegex = /^[6-9]\d{9}$/;

        if (!mobileRegex.test(cleanMobile)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid mobile number."
            });
        }

        const user = await User.findOne({
            mobile: cleanMobile
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid mobile number or password."
            });
        }

        if (user.isArchived === true) {
            return res.status(403).json({
                success: false,
                message: "Your account has been archived. Please contact the administrator."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid mobile number or password."
            });
        }

        await createUserSession(req, user._id);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                id: user._id,
                name: user.name
            }
        });

    } catch (error) {
        console.error("User Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
};

// =====================================
// GET CURRENT USER
// =====================================

const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated."
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                address: user.address
            }
        });

    } catch (error) {
        console.error("Get Current User Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to get user information."
        });
    }
};

// =====================================
// EXPORT CONTROLLERS
// =====================================

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser
};

