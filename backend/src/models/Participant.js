
const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "in-progress",
        "submitted",
        "auto-submitted",
        "disconnected",
      ],
      default: "waiting",
    },

    // Student's individual test start time
    startedAt: {
      type: Date,
      default: null,
    },

    // Student's individual timer deadline
    deadlineAt: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },

        selectedAnswer: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    timeTakenSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One participant can have only one attempt per test
participantSchema.index(
  { user: 1, test: 1 },
  { unique: true }
);

module.exports = mongoose.model("Participant", participantSchema);

