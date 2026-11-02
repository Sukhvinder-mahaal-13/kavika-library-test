
const mongoose = require("mongoose");
const Result = require("../models/Result");
const User = require("../models/User");

// =====================================
// TEST SCHEMA
// =====================================

const testSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Test title is required"],
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },

        // =====================================
        // TEST ACCESS KEY
        // Admin sets this key while creating test
        // =====================================

        accessKey: {
            type: String,
            required: [true, "Test access key is required"],
            trim: true,
            minlength: 4,
            maxlength: 50
        },

        scheduledStartAt: {
            type: Date,
            required: [true, "Test start date and time are required"]
        },

        durationMinutes: {
            type: Number,
            required: [true, "Test duration is required"],
            min: 1
        },

        status: {
            type: String,
            enum: [
                "draft",
                "scheduled",
                "live",
                "completed",
                "cancelled"
            ],
            default: "draft"
        },

        totalQuestions: {
            type: Number,
            default: 0,
            min: 0
        },

        resultPublished: {
            type: Boolean,
            default: false
        },

        // Admin manually closes the test
        closedByAdmin: {
            type: Boolean,
            default: false
        },

        // Test closing date and time
        closedAt: {
            type: Date,
            default: null
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// =====================================
// GET SINGLE STUDENT DETAILS
// =====================================

const getStudentDetails = async (req, res) => {
    try {
        const { userId } = req.params;

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

        // Fetch all results of this student
        const results = await Result.find({
            user: userId
        })
            .populate(
                "test",
                "title scheduledStartAt durationMinutes status"
            )
            .sort({ createdAt: -1 })
            .lean();

        // Calculate overall performance
        const totalTests = results.length;

        const totalObtainedMarks = results.reduce(
            (sum, result) => sum + result.obtainedMarks,
            0
        );

        const totalMaximumMarks = results.reduce(
            (sum, result) => sum + result.totalMarks,
            0
        );

        const averagePercentage = totalMaximumMarks > 0
            ? Number(
                (
                    (totalObtainedMarks / totalMaximumMarks) * 100
                ).toFixed(2)
            )
            : 0;

        const bestResult = results.reduce((best, current) => {
            if (!best) {
                return current;
            }

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
// TEST MODEL
// =====================================

const Test = mongoose.model("Test", testSchema);

// =====================================
// EXPORTS
// =====================================

module.exports = Test;
module.exports.getStudentDetails = getStudentDetails;

