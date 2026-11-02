
const mongoose = require("mongoose");

const Test = require("../models/Test");
const Question = require("../models/Question");
const Participant = require("../models/Participant");
const Result = require("../models/Result");

// ==========================================
// AUTOMATICALLY COMPLETE EXPIRED TESTS
// ==========================================

const completeExpiredTests = async () => {
    try {
        const now = new Date();

        await Test.updateMany(
            {
                status: "live",
                $expr: {
                    $lte: [
                        {
                            $add: [
                                "$scheduledStartAt",
                                {
                                    $multiply: [
                                        "$durationMinutes",
                                        60 * 1000
                                    ]
                                }
                            ]
                        },
                        now
                    ]
                }
            },
            {
                $set: {
                    status: "completed"
                }
            }
        );

    } catch (error) {
        console.error("Complete Expired Tests Error:", error);
    }
};

// ==========================================
// CREATE TEST (ADMIN)
// ==========================================

const createTest = async (req, res) => {
    try {
        const {
            title,
            description,
            scheduledStartAt,
            durationMinutes,
            accessKey
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Test title is required."
            });
        }

        // Validate Access Key
        if (
            typeof accessKey !== "string" ||
            accessKey.trim().length < 4 ||
            accessKey.trim().length > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Access key must be between 4 and 50 characters."
            });
        }

        if (
            !scheduledStartAt ||
            Number.isNaN(Date.parse(scheduledStartAt))
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid test start date is required."
            });
        }

        const startDate = new Date(scheduledStartAt);

        if (startDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Test start date must be in the future."
            });
        }

        const duration = Number(durationMinutes);

        if (!Number.isInteger(duration) || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid test duration is required."
            });
        }

        const test = await Test.create({
            title: title.trim(),
            description: description || "",
            accessKey: accessKey.trim(),
            scheduledStartAt: startDate,
            durationMinutes: duration,
            status: "scheduled",
            totalQuestions: 0,
            createdBy: req.admin?._id
        });

        return res.status(201).json({
            success: true,
            message: "Test scheduled successfully.",
            test
        });

    } catch (error) {
        console.error("Create Test Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create test."
        });
    }
};

// ==========================================
// GET ALL TESTS (ADMIN)
// ==========================================

const getAllTests = async (req, res) => {
    try {
        await completeExpiredTests();

        const tests = await Test.find()
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            tests
        });

    } catch (error) {
        console.error("Get All Tests Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch tests."
        });
    }
};

// ==========================================
// GET UPCOMING / LIVE TEST (USER)
// ==========================================

const getUpcomingTest = async (req, res) => {
    try {
        const now = new Date();

        await completeExpiredTests();

        const test = await Test.findOne({
            status: {
                $in: ["scheduled", "live"]
            },
            $expr: {
                $gt: [
                    {
                        $add: [
                            "$scheduledStartAt",
                            {
                                $multiply: [
                                    "$durationMinutes",
                                    60 * 1000
                                ]
                            }
                        ]
                    },
                    now
                ]
            }
        }).sort({
            scheduledStartAt: 1
        });

        if (!test) {
            return res.status(200).json({
                success: true,
                test: null,
                totalParticipants: 0,
                inProgressParticipants: 0
            });
        }

        if (
            test.status === "scheduled" &&
            test.scheduledStartAt <= now
        ) {
            test.status = "live";
            await test.save();
        }

        await Participant.findOneAndUpdate(
            {
                user: req.user._id,
                test: test._id
            },
            {
                $setOnInsert: {
                    status: "waiting",
                    startedAt: null,
                    submittedAt: null
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        const totalParticipants = await Participant.countDocuments({
            test: test._id
        });

        const inProgressParticipants = await Participant.countDocuments({
            test: test._id,
            status: "in-progress"
        });

        return res.status(200).json({
            success: true,
            test,
            totalParticipants,
            inProgressParticipants
        });

    } catch (error) {
        console.error("Get Upcoming Test Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch upcoming test."
        });
    }
};

// ==========================================
// UNLOCK TEST (USER)
// ==========================================

const unlockTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { accessKey } = req.body;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID."
            });
        }

        if (
            typeof accessKey !== "string" ||
            !accessKey.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter the test access key."
            });
        }

        const test = await Test.findById(testId).select("+accessKey");

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found."
            });
        }

        const now = new Date();

        if (test.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "This test has been cancelled."
            });
        }

        if (
            test.status === "completed" ||
            test.closedByAdmin
        ) {
            return res.status(400).json({
                success: false,
                message: "This test is closed."
            });
        }

        if (now < test.scheduledStartAt) {
            return res.status(400).json({
                success: false,
                message: "Test has not started yet."
            });
        }

        const deadline = new Date(
            test.scheduledStartAt.getTime() +
            test.durationMinutes * 60 * 1000
        );

        if (now >= deadline) {
            return res.status(400).json({
                success: false,
                message: "Test time has expired."
            });
        }

        if (accessKey.trim() !== test.accessKey) {
            return res.status(401).json({
                success: false,
                message: "Incorrect access key. Please try again."
            });
        }

        let participant = await Participant.findOne({
            user: req.user._id,
            test: test._id
        });

        if (!participant) {
            participant = await Participant.create({
                user: req.user._id,
                test: test._id,
                status: "waiting"
            });
        }

        if (
            participant.status === "submitted" ||
            participant.status === "auto-submitted"
        ) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted this test."
            });
        }

        if (participant.status !== "in-progress") {
            participant.status = "in-progress";
            participant.startedAt = now;
            participant.deadlineAt = deadline;

            await participant.save();
        }

        return res.status(200).json({
            success: true,
            message: "Test unlocked successfully.",
            testId: test._id,
            participant
        });

    } catch (error) {
        console.error("Unlock Test Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to unlock test."
        });
    }
};

// ==========================================
// GET TEST DETAILS (ADMIN)
// ==========================================

const getTestDetails = async (req, res) => {
    try {
        const { testId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID."
            });
        }

        await completeExpiredTests();

        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found."
            });
        }

        return res.status(200).json({
            success: true,
            test
        });

    } catch (error) {
        console.error("Get Test Details Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch test details."
        });
    }
};

// ==========================================
// UPDATE TEST STATUS (ADMIN)
// ==========================================

const updateTestStatus = async (req, res) => {
    try {
        const { testId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "draft",
            "scheduled",
            "cancelled"
        ];

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID."
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test status."
            });
        }

        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found."
            });
        }

        if (["live", "completed"].includes(test.status)) {
            return res.status(400).json({
                success: false,
                message: "A live or completed test cannot be changed this way."
            });
        }

        test.status = status;
        await test.save();

        return res.status(200).json({
            success: true,
            message: "Test status updated successfully.",
            test
        });

    } catch (error) {
        console.error("Update Test Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update test status."
        });
    }
};

// ==========================================
// DELETE TEST (ADMIN)
// ==========================================

const deleteTest = async (req, res) => {
    try {
        const { testId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
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

        // LIVE tests cannot be deleted.
        // Completed tests can now be deleted.
        if (test.status === "live") {
            return res.status(400).json({
                success: false,
                message: "A live test cannot be deleted."
            });
        }

        // Only allow known test statuses.
        const allowedDeleteStatuses = [
            "draft",
            "scheduled",
            "cancelled",
            "completed"
        ];

        if (!allowedDeleteStatuses.includes(test.status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test status for deletion."
            });
        }

        // Delete all associated records.
        await Promise.all([
            Result.deleteMany({
                test: testId
            }),

            Participant.deleteMany({
                test: testId
            }),

            Question.deleteMany({
                test: testId
            })
        ]);

        await Test.deleteOne({
            _id: testId
        });

        return res.status(200).json({
            success: true,
            message: "Test and all associated records deleted successfully."
        });

    } catch (error) {
        console.error("Delete Test Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete test.",
            error: error.message
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    createTest,
    getAllTests,
    getUpcomingTest,
    unlockTest,
    getTestDetails,
    updateTestStatus,
    deleteTest
};
