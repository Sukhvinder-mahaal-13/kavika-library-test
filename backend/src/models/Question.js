const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
{
test: {
type: mongoose.Schema.Types.ObjectId,
ref: "Test",
required: true
},


    questionText: {
        type: String,
        required: [true, "Question text is required"],
        trim: true
    },

    options: {
        type: [
            {
                type: String,
                required: true,
                trim: true
            }
        ],
        validate: {
            validator: function (options) {
                return options.length >= 2 && options.length <= 6;
            },
            message: "A question must have between 2 and 6 options"
        }
    },

    correctAnswer: {
        type: Number,
        required: [true, "Correct answer is required"],
        min: 0
    },

    marks: {
        type: Number,
        default: 1,
        min: 0
    },

    order: {
        type: Number,
        required: true,
        min: 1
    }
},
{
    timestamps: true
}


);

questionSchema.pre("validate", function () {
if (
Array.isArray(this.options) &&
this.correctAnswer >= this.options.length
) {
this.invalidate(
"correctAnswer",
"Correct answer must match one of the available options"
);
}
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
