const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true   // 🔥 THIS WAS MISSING
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", ResultSchema);
