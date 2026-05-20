const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true
    },
    code: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: ["javascript", "python", "cpp"],
      required: true
    },
    status: {
      type: String,
      enum: ["Accepted", "Wrong Answer", "Runtime Error", "Compile Error", "Pending"],
      default: "Pending"
    },
    score: {
      type: Number,
      default: 0
    },
    output: {
      type: String,
      default: ""
    },
    details: {
      type: [
        {
          testCase: Number,
          passed: Boolean,
          expectedOutput: String,
          actualOutput: String,
          status: String
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
