
const mongoose = require("mongoose");

const Question = require("../models/Question");
const Test = require("../models/Test");
const Participant = require("../models/Participant");

// ==========================================
// CREATE QUESTION (ADMIN)
// ==========================================

const createQuestion = async (req, res) => {
    try {
        const { testId } = req.params;

        const {
            questionText,
            options,
            correctAnswer,
            marks
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID."
            });
        }

        if (
            !questionText ||
            typeof questionText !== "string" ||
            !questionText.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Question text is required."
            });
        }

        if (
            !Array.isArray(options) ||
            options.length < 2 ||
            options.length > 6 ||
            options.some(
                option =>
                    typeof option !== "string" ||
                    !option.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide between 2 and 6 valid options."
            });
        }

        if (
            !Number.isInteger(correctAnswer) ||
            correctAnswer < 0 ||
            correctAnswer >= options.length
        ) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid correct answer."
            });
        }

        const questionMarks = marks === undefined
            ? 1
            : Number(marks);

        if (
            !Number.isFinite(questionMarks) ||
            questionMarks < 1 ||
            questionMarks > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Marks must be between 1 and 100."
            });
        }

        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found."
            });
        }

        if (!["draft", "scheduled"].includes(test.status)) {
            return res.status(400).json({
                success: false,
                message: "Questions cannot be added after the test starts."
            });
        }

        const lastQuestion = await Question.findOne({
            test: testId
        })
            .sort({ order: -1 })
            .select("order");

        const nextOrder = lastQuestion
            ? lastQuestion.order + 1
            : 1;

        const question = await Question.create({
            test: testId,
            questionText: questionText.trim(),
            options: options.map(option => option.trim()),
            correctAnswer,
            marks: questionMarks,
            order: nextOrder
        });

        test.totalQuestions = await Question.countDocuments({
            test: testId
        });

        await test.save();

        return res.status(201).json({
            success: true,
            message: "Question added successfully.",
            question
        });

    } catch (error) {
        console.error("Create Question Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create question."
        });
    }
};

// ==========================================
// GET QUESTIONS (ADMIN)
// ==========================================

const getAdminQuestions = async (req, res) => {
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

        const questions = await Question.find({
            test: testId
        }).sort({ order: 1 });

        return res.status(200).json({
            success: true,
            test,
            questions
        });

    } catch (error) {
        console.error("Get Admin Questions Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load questions."
        });
    }
};

// ==========================================
// GET QUESTIONS (USER)
// Access Key must be verified first.
// Correct answers are never sent.
// ==========================================

const getStudentQuestions = async (req, res) => {
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

        const now = new Date();

        // Test must have started.
        if (now < test.scheduledStartAt) {
            return res.status(403).json({
                success: false,
                message: "The test has not started yet."
            });
        }

        // Test must be live.
        if (test.status !== "live") {
            return res.status(400).json({
                success: false,
                message: "This test is not currently live."
            });
        }

        // Admin closed test check.
        if (test.closedByAdmin) {
            return res.status(403).json({
                success: false,
                message: "This test has been closed by the admin."
            });
        }

        // ==========================================
        // CHECK PARTICIPANT ACCESS
        // ==========================================

        const participant = await Participant.findOne({
            user: req.user._id,
            test: testId
        });

        // Participant must unlock the test first.
        if (!participant) {
            return res.status(403).json({
                success: false,
                message: "Please unlock the test using the access key."
            });
        }

        // Participant must be in progress.
        if (participant.status !== "in-progress") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this test."
            });
        }

        // Submitted test cannot be accessed again.
        if (
            participant.status === "submitted" ||
            participant.status === "auto-submitted"
        ) {
            return res.status(403).json({
                success: false,
                message: "You have already submitted this test."
            });
        }

        // ==========================================
        // CHECK TEST DEADLINE
        // ==========================================

        const deadline = participant.deadlineAt
            ? new Date(participant.deadlineAt)
            : new Date(
                participant.startedAt.getTime() +
                test.durationMinutes * 60 * 1000
            );

        if (now >= deadline) {
            participant.status = "auto-submitted";
            participant.submittedAt = now;

            await participant.save();

            return res.status(403).json({
                success: false,
                message: "Your test time has expired."
            });
        }

        // ==========================================
        // CALCULATE REMAINING TIME
        // ==========================================

        const remainingSeconds = Math.max(
            0,
            Math.floor(
                (deadline.getTime() - now.getTime()) / 1000
            )
        );

        // ==========================================
        // FETCH QUESTIONS
        // NEVER SEND CORRECT ANSWERS
        // ==========================================

        const questions = await Question.find({
            test: testId
        })
            .select("questionText options marks order")
            .sort({ order: 1 })
            .lean();

        return res.status(200).json({
            success: true,

            test: {
                _id: test._id,
                title: test.title,
                durationMinutes: test.durationMinutes
            },

            questions,

            remainingSeconds
        });

    } catch (error) {
        console.error("Get Student Questions Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load test questions."
        });
    }
};

// ==========================================
// DELETE ONE QUESTION (ADMIN)
// Only draft/scheduled tests are allowed.
// ==========================================

const deleteQuestion = async (req, res) => {
    try {
        const { testId, questionId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(testId) ||
            !mongoose.Types.ObjectId.isValid(questionId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid test or question ID."
            });
        }

        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found."
            });
        }

        if (!["draft", "scheduled"].includes(test.status)) {
            return res.status(400).json({
                success: false,
                message: "Questions cannot be deleted after the test starts."
            });
        }

        const question = await Question.findOne({
            _id: questionId,
            test: testId
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found in this test."
            });
        }

        await Question.deleteOne({
            _id: questionId,
            test: testId
        });

        const remainingQuestions = await Question.find({
            test: testId
        }).sort({ order: 1 });

        for (
            let index = 0;
            index < remainingQuestions.length;
            index++
        ) {
            const expectedOrder = index + 1;

            if (
                remainingQuestions[index].order !== expectedOrder
            ) {
                remainingQuestions[index].order = expectedOrder;

                await remainingQuestions[index].save();
            }
        }

        test.totalQuestions = remainingQuestions.length;

        await test.save();

        return res.status(200).json({
            success: true,
            message: "Question deleted successfully.",
            totalQuestions: remainingQuestions.length
        });

    } catch (error) {
        console.error("Delete Question Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete question."
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    createQuestion,
    getAdminQuestions,
    getStudentQuestions,
    deleteQuestion
};

