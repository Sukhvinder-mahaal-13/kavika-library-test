
const Admin = require("../models/Admin");
const User = require("../models/User");
const Result = require("../models/Result");
const Test = require("../models/Test");
const Participant = require("../models/Participant");
const bcrypt = require("bcrypt");

// =====================================
// ADMIN LOGIN
// =====================================

const adminLogin = async (req, res) => {
    try {
        const { email, mobile, password } = req.body;

        if (!email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Email, mobile number and password are required."
            });
        }

        const admin = await Admin.findOne({
            email: email.trim().toLowerCase(),
            mobile: mobile.trim()
        }).select("+password");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid login credentials."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid login credentials."
            });
        }

        await new Promise((resolve, reject) => {
            req.session.regenerate((error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        req.session.adminId = admin._id.toString();

        await new Promise((resolve, reject) => {
            req.session.save((error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        return res.status(200).json({
            success: true,
            message: "Admin login successful.",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Admin login failed."
        });
    }
};

// =====================================
// ADMIN LOGOUT
// =====================================

const adminLogout = async (req, res) => {
    try {
        req.session.destroy((error) => {
            if (error) {
                console.error("Admin Logout Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Logout failed."
                });
            }

            res.clearCookie("kavika.sid");

            return res.status(200).json({
                success: true,
                message: "Admin logged out successfully."
            });
        });

    } catch (error) {
        console.error("Admin Logout Error:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed."
        });
    }
};

// =====================================
// GET CURRENT ADMIN
// =====================================

const getCurrentAdmin = async (req, res) => {
    try {
        const admin = req.admin;

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin not authenticated."
            });
        }

        return res.status(200).json({
            success: true,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                mobile: admin.mobile
            }
        });

    } catch (error) {
        console.error("Get Admin Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to get admin information."
        });
    }
};

// =====================================
// GET REGISTERED STUDENTS
// =====================================

const getRegisteredStudents = async (req, res) => {
    try {
        const students = await User.find({
            isArchived: { $ne: true }
        })
            .select("name address mobile createdAt")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            totalStudents: students.length,
            students
        });

    } catch (error) {
        console.error("Get Registered Students Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch registered students."
        });
    }
};

// =====================================
// GET ARCHIVED STUDENTS
// =====================================

const getArchivedStudents = async (req, res) => {
    try {
        const students = await User.find({
            isArchived: true
        })
            .select("name address mobile createdAt archivedAt")
            .sort({ archivedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            totalArchived: students.length,
            students
        });

    } catch (error) {
        console.error("Get Archived Students Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch archived students."
        });
    }
};

// =====================================
// GET SINGLE STUDENT DETAILS
// GET /api/admin/students/:userId
// =====================================

const getStudentDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate MongoDB ID
        if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }

        // Fetch student information
        const student = await User.findById(userId)
            .select(
                "name address mobile isArchived createdAt updatedAt"
            )
            .lean();

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // Fetch all exam results of this student
        const results = await Result.find({
            user: userId
        })
            .populate(
                "test",
                "title scheduledStartAt durationMinutes status"
            )
            .sort({ createdAt: -1 })
            .lean();

        // Calculate total tests
        const totalTests = results.length;

        // Calculate total obtained marks
        const totalObtainedMarks = results.reduce(
            (sum, result) => sum + (result.obtainedMarks || 0),
            0
        );

        // Calculate maximum marks
        const totalMaximumMarks = results.reduce(
            (sum, result) => sum + (result.totalMarks || 0),
            0
        );

        // Calculate average percentage
        const averagePercentage = totalMaximumMarks > 0
            ? Number(
                (
                    (totalObtainedMarks / totalMaximumMarks) * 100
                ).toFixed(2)
            )
            : 0;

        // Find best result based on percentage
        const bestResult = results.reduce((best, current) => {
            if (!best) return current;

            const currentPercentage = current.totalMarks > 0
                ? current.obtainedMarks / current.totalMarks
                : 0;

            const bestPercentage = best.totalMarks > 0
                ? best.obtainedMarks / best.totalMarks
                : 0;

            return currentPercentage > bestPercentage
                ? current
                : best;
        }, null);

        return res.status(200).json({
            success: true,

            student,

            performance: {
                totalTests,
                totalObtainedMarks,
                totalMaximumMarks,
                averagePercentage,
                bestResult
            },

            results
        });

    } catch (error) {
        console.error("Get Student Details Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch student details."
        });
    }
};

// =====================================
// ARCHIVE SINGLE STUDENT
// =====================================

const archiveStudent = async (req, res) => {
    try {
        const { userId } = req.params;

        const student = await User.findById(userId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        if (student.isArchived) {
            return res.status(400).json({
                success: false,
                message: "Student is already archived."
            });
        }

        student.isArchived = true;
        student.archivedAt = new Date();

        await student.save();

        return res.status(200).json({
            success: true,
            message: "Student archived successfully."
        });

    } catch (error) {
        console.error("Archive Student Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to archive student."
        });
    }
};

// =====================================
// RESTORE SINGLE STUDENT
// =====================================

const restoreStudent = async (req, res) => {
    try {
        const { userId } = req.params;

        const student = await User.findById(userId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        if (!student.isArchived) {
            return res.status(400).json({
                success: false,
                message: "Student is not archived."
            });
        }

        student.isArchived = false;
        student.archivedAt = null;

        await student.save();

        return res.status(200).json({
            success: true,
            message: "Student restored successfully."
        });

    } catch (error) {
        console.error("Restore Student Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to restore student."
        });
    }
};

// =====================================
// PERMANENTLY DELETE SINGLE STUDENT
// =====================================

const deleteStudent = async (req, res) => {
    try {
        const { userId } = req.params;

        const student = await User.findById(userId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        await User.deleteOne({ _id: userId });

        return res.status(200).json({
            success: true,
            message: "Student account permanently deleted. Existing test records have been preserved."
        });

    } catch (error) {
        console.error("Delete Student Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete student."
        });
    }
};

// =====================================
// DELETE ALL STUDENTS
// =====================================

const deleteAllStudents = async (req, res) => {
    try {
        const result = await User.deleteMany({});

        return res.status(200).json({
            success: true,
            deletedCount: result.deletedCount,
            message: `${result.deletedCount} student accounts permanently deleted. Existing test records have been preserved.`
        });

    } catch (error) {
        console.error("Delete All Students Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete all student accounts."
        });
    }
};

// =====================================
// ADMIN MANUALLY CLOSE TEST
// POST /api/admin/tests/:testId/close
// =====================================

const closeTest = async (req, res) => {
    try {
        const { testId } = req.params;

        // Validate MongoDB ID
        if (!/^[0-9a-fA-F]{24}$/.test(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID."
            });
        }

        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found."
            });
        }

        if (test.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "This test is already completed."
            });
        }

        if (test.status !== "live") {
            return res.status(400).json({
                success: false,
                message: "Only live tests can be closed."
            });
        }

        const now = new Date();

        // Close test
        test.status = "completed";
        test.closedByAdmin = true;
        test.closedAt = now;

        await test.save();

        // Find all students currently taking the test
        const activeParticipants = await Participant.find({
            test: testId,
            status: "in-progress"
        });

        // Mark active participants as auto-submitted
        for (const participant of activeParticipants) {
            participant.status = "auto-submitted";
            participant.submittedAt = now;

            if (participant.startedAt) {
                participant.timeTakenSeconds = Math.max(
                    0,
                    Math.floor(
                        (
                            now.getTime() -
                            new Date(participant.startedAt).getTime()
                        ) / 1000
                    )
                );
            }

            await participant.save();
        }

        return res.status(200).json({
            success: true,
            message: "Test closed successfully.",
            test,
            closedParticipants: activeParticipants.length
        });

    } catch (error) {
        console.error("Admin Close Test Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to close test."
        });
    }
};

// =====================================
// EXPORT CONTROLLERS
// =====================================

module.exports = {
    adminLogin,
    adminLogout,
    getCurrentAdmin,
    getRegisteredStudents,
    getArchivedStudents,
    getStudentDetails,
    archiveStudent,
    restoreStudent,
    deleteStudent,
    deleteAllStudents,

    // New controller
    closeTest
};

