const mongoose = require("mongoose");

const contestSubmissionSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true
    },
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
    language: {
      type: String,
      enum: ["javascript", "python", "cpp"],
      required: true
    },
    code: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["Accepted", "Wrong Answer", "Runtime Error", "Compile Error"],
      required: true
    },
    score: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContestSubmission", contestSubmissionSchema);
