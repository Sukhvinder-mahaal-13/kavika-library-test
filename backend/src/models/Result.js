const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
{
user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},

    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true
    },

    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant",
        required: true
    },

    totalMarks: {
        type: Number,
        required: true,
        min: 0
    },

    obtainedMarks: {
        type: Number,
        required: true,
        min: 0
    },

    correctAnswers: {
        type: Number,
        default: 0,
        min: 0
    },

    wrongAnswers: {
        type: Number,
        default: 0,
        min: 0
    },

    unanswered: {
        type: Number,
        default: 0,
        min: 0
    },

    rank: {
        type: Number,
        default: null,
        min: 1
    },

    timeTakenSeconds: {
        type: Number,
        default: 0,
        min: 0
    }
},
{
    timestamps: true
}


);

// One result per participant in a particular test.
resultSchema.index(
{ participant: 1, test: 1 },
{ unique: true }
);

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;
