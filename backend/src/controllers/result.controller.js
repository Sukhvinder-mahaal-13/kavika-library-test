const mongoose = require("mongoose");

const Test = require("../models/Test");
const Question = require("../models/Question");
const Participant = require("../models/Participant");
const Result = require("../models/Result");

// =====================================
// SUBMIT TEST AND CALCULATE RESULT
// =====================================

const submitTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { answers } = req.body;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID."
            });
        }

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "Answers must be provided as an array."
            });
        }

        const test = await Test.findById(testId);

        if (!test || test.status !== "live") {
            return res.status(400).json({
                success: false,
                message: "This test is not currently active."
            });
        }

        const participant = await Participant.findOne({
            user: req.user._id,
            test: testId
        });

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: "You are not registered for this test."
            });
        }

        if (participant.status !== "in-progress") {
            return res.status(400).json({
                success: false,
                message: "Your test is not in progress or has already been submitted."
            });
        }

        if (!participant.startedAt) {
            return res.status(400).json({
                success: false,
                message: "Test start time was not recorded."
            });
        }

        const now = new Date();

        const startTime = new Date(
            participant.startedAt
        ).getTime();

        const durationMilliseconds =
            test.durationMinutes * 60 * 1000;

        const elapsedMilliseconds =
            now.getTime() - startTime;

        const isAutoSubmitted =
            elapsedMilliseconds >= durationMilliseconds;

        const questions = await Question.find({
            test: testId
        });

        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "This test has no questions."
            });
        }

        const questionMap = new Map(
            questions.map(question => [
                question._id.toString(),
                question
            ])
        );

        const submittedAnswers = new Map();

        for (const answer of answers) {
            const questionId = String(answer.question);

            if (submittedAnswers.has(questionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate question answers are not allowed."
                });
            }

            const question = questionMap.get(questionId);

            if (!question) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid question submitted."
                });
            }

            if (
                !Number.isInteger(answer.selectedAnswer) ||
                answer.selectedAnswer < 0 ||
                answer.selectedAnswer >= question.options.length
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid answer option."
                });
            }

            submittedAnswers.set(
                questionId,
                answer.selectedAnswer
            );
        }

        // =====================================
        // CALCULATE MARKS
        // =====================================

        let obtainedMarks = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let unanswered = 0;
        let totalMarks = 0;

        const finalAnswers = [];

        for (const question of questions) {
            totalMarks += question.marks;

            const questionId = question._id.toString();

            if (!submittedAnswers.has(questionId)) {
                unanswered++;
                continue;
            }

            const selectedAnswer =
                submittedAnswers.get(questionId);

            finalAnswers.push({
                question: question._id,
                selectedAnswer
            });

            if (selectedAnswer === question.correctAnswer) {
                correctAnswers++;
                obtainedMarks += question.marks;
            } else {
                wrongAnswers++;
            }
        }

        // =====================================
        // CALCULATE TIME
        // =====================================

        const timeTakenSeconds = Math.min(
            Math.max(
                0,
                Math.floor(elapsedMilliseconds / 1000)
            ),
            test.durationMinutes * 60
        );

        // =====================================
        // UPDATE PARTICIPANT
        // =====================================

        participant.answers = finalAnswers;
        participant.score = obtainedMarks;
        participant.timeTakenSeconds = timeTakenSeconds;
        participant.submittedAt = now;

        participant.status = isAutoSubmitted
            ? "auto-submitted"
            : "submitted";

        await participant.save();

        // =====================================
        // SAVE RESULT IN DATABASE
        // =====================================

        await Result.create({
            user: req.user._id,
            test: testId,
            participant: participant._id,
            totalMarks,
            obtainedMarks,
            correctAnswers,
            wrongAnswers,
            unanswered,
            timeTakenSeconds
        });

        return res.status(200).json({
            success: true,
            message: isAutoSubmitted
                ? "Your test was automatically submitted. Results will be available after publication."
                : "Your test was submitted successfully. Results will be available after publication."
        });

    } catch (error) {
        console.error("Submit Test Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit test."
        });
    }
};


// =====================================
// GET MY RESULT (STUDENT - SINGLE TEST)
// =====================================

const getMyResult = async (req, res) => {
    try {
        const { testId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID."
            });
        }

        const result = await Result.findOne({
            user: req.user._id,
            test: testId
        }).populate("test", "title resultPublished");

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found."
            });
        }

        if (
            !result.test ||
            !result.test.resultPublished
        ) {
            return res.status(403).json({
                success: false,
                message: "Result has not been published yet."
            });
        }

        const totalParticipants = await Result.countDocuments({
            test: testId
        });

        // =====================================
        // GET TOP 3 STUDENTS
        // ONLY NAME AND ADDRESS ARE SHARED
        // =====================================

        const topResults = await Result.find({
            test: testId
        })
            .sort({
                rank: 1,
                obtainedMarks: -1,
                timeTakenSeconds: 1
            })
            .limit(3)
            .populate("user", "name address");

        const topThree = topResults.map(item => ({
            name: item.user?.name || "Student",
            address: item.user?.address || "Address unavailable",
            rank: item.rank
        }));

        return res.status(200).json({
            success: true,

            result: {
                testTitle: result.test.title,
                totalMarks: result.totalMarks,
                obtainedMarks: result.obtainedMarks,
                correctAnswers: result.correctAnswers,
                wrongAnswers: result.wrongAnswers,
                unanswered: result.unanswered,
                rank: result.rank,
                totalParticipants,
                timeTakenSeconds: result.timeTakenSeconds
            },

            topThree
        });

    } catch (error) {
        console.error("Get My Result Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch result."
        });
    }
};


// =====================================
// GET ALL PUBLISHED RESULTS (STUDENT)
// =====================================

const getMyResults = async (req, res) => {
    try {

        // =====================================
        // GET ONLY LOGGED-IN STUDENT'S
        // PUBLISHED TEST RESULTS
        // =====================================

        const results = await Result.find({
            user: req.user._id
        })
            .populate({
                path: "test",
                match: {
                    resultPublished: true
                },
                select: "title scheduledStartAt resultPublished"
            })
            .sort({
                createdAt: -1
            })
            .lean();

        // Remove results whose tests are not published
        const publishedResults = results.filter(
            item => item.test !== null
        );

        // =====================================
        // PREPARE RESULTS WITH TOP 3
        // =====================================

        const formattedResults = await Promise.all(
            publishedResults.map(async (item) => {

                const topResults = await Result.find({
                    test: item.test._id
                })
                    .sort({
                        rank: 1,
                        obtainedMarks: -1,
                        timeTakenSeconds: 1
                    })
                    .limit(3)
                    .populate("user", "name address")
                    .lean();

                const topThree = topResults.map(student => ({
                    name: student.user?.name || "Student",
                    address: student.user?.address || "Address unavailable",
                    rank: student.rank
                }));

                return {
                    _id: item._id,

                    test: {
                        _id: item.test._id,
                        title: item.test.title,
                        scheduledStartAt: item.test.scheduledStartAt
                    },

                    obtainedMarks: item.obtainedMarks,
                    totalMarks: item.totalMarks,

                    percentage: item.totalMarks > 0
                        ? Number(
                            (
                                (item.obtainedMarks / item.totalMarks) * 100
                            ).toFixed(2)
                        )
                        : 0,

                    correctAnswers: item.correctAnswers,
                    wrongAnswers: item.wrongAnswers,
                    unanswered: item.unanswered,

                    rank: item.rank,
                    timeTakenSeconds: item.timeTakenSeconds,

                    createdAt: item.createdAt,

                    topThree
                };
            })
        );

        return res.status(200).json({
            success: true,
            totalResults: formattedResults.length,
            results: formattedResults
        });

    } catch (error) {
        console.error("Get My Results Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your results."
        });
    }
};


// =====================================
// GET ADMIN COMPLETE TEST RESULTS
// =====================================

const getAdminTestResults = async (req, res) => {
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

        const results = await Result.find({
            test: testId
        })
            .populate("user", "name address mobile")
            .sort({
                rank: 1,
                obtainedMarks: -1,
                timeTakenSeconds: 1
            });

        return res.status(200).json({
            success: true,
            testTitle: test.title,
            resultPublished: test.resultPublished,
            totalParticipants: results.length,

            results: results.map(item => ({
                student: item.user ? {
                    _id: item.user._id,
                    name: item.user.name,
                    address: item.user.address,
                    mobile: item.user.mobile
                } : null,

                rank: item.rank,
                totalMarks: item.totalMarks,
                obtainedMarks: item.obtainedMarks,
                correctAnswers: item.correctAnswers,
                wrongAnswers: item.wrongAnswers,
                unanswered: item.unanswered,
                timeTakenSeconds: item.timeTakenSeconds
            }))
        });

    } catch (error) {
        console.error("Get Admin Test Results Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch admin results."
        });
    }
};


// =====================================
// PUBLISH OR HIDE RESULTS (ADMIN)
// =====================================

const updateResultVisibility = async (req, res) => {
    try {
        const { testId } = req.params;
        const { published } = req.body;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID."
            });
        }

        if (typeof published !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Published must be true or false."
            });
        }

        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found."
            });
        }

        if (test.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "Results can only be published after test completion."
            });
        }

        if (published) {

            // =====================================
            // CHECK ALL PARTICIPANT RESULTS
            // =====================================

            const participantCount = await Participant.countDocuments({
                test: testId,
                status: {
                    $in: ["submitted", "auto-submitted"]
                }
            });

            const resultCount = await Result.countDocuments({
                test: testId
            });

            if (participantCount !== resultCount) {
                return res.status(400).json({
                    success: false,
                    message: "Some participant results are still being processed."
                });
            }

            // =====================================
            // CALCULATE RANKING
            // =====================================

            const results = await Result.find({
                test: testId
            }).sort({
                obtainedMarks: -1,
                timeTakenSeconds: 1,
                createdAt: 1
            });

            let currentRank = 0;
            let previousMarks = null;

            for (let index = 0; index < results.length; index++) {
                const item = results[index];

                if (
                    previousMarks === null ||
                    item.obtainedMarks !== previousMarks
                ) {
                    currentRank = index + 1;
                }

                item.rank = currentRank;

                previousMarks = item.obtainedMarks;
            }

            // =====================================
            // SAVE ALL RANKS
            // =====================================

            if (results.length > 0) {
                await Result.bulkWrite(
                    results.map(item => ({
                        updateOne: {
                            filter: {
                                _id: item._id
                            },

                            update: {
                                $set: {
                                    rank: item.rank
                                }
                            }
                        }
                    }))
                );
            }
        }

        // =====================================
        // UPDATE RESULT VISIBILITY
        // =====================================

        test.resultPublished = published;

        await test.save();

        return res.status(200).json({
            success: true,
            message: published
                ? "Results published successfully."
                : "Results hidden successfully."
        });

    } catch (error) {
        console.error("Update Result Visibility Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update result visibility."
        });
    }
};


// =====================================
// EXPORT CONTROLLERS
// =====================================

module.exports = {
    submitTest,
    getMyResult,
    getMyResults,
    getAdminTestResults,
    updateResultVisibility
};