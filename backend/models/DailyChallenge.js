const mongoose = require("mongoose");

const dailyChallengeSchema = new mongoose.Schema(
  {
    challengeDate: {
      type: String,
      required: true,
      unique: true
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyChallenge", dailyChallengeSchema);
