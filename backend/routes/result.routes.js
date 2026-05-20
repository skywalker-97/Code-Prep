const express = require("express");
const Result = require("../models/Result");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/my-results", auth, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to load results" });
  }
});

router.get("/leaderboard", auth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);

    const leaderboard = await Result.aggregate([
      {
        $addFields: {
          percentage: {
            $cond: [
              { $gt: ["$totalQuestions", 0] },
              { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] },
              0
            ]
          },
          normalizedTimeTakenSeconds: { $ifNull: ["$timeTakenSeconds", 0] }
        }
      },
      {
        $sort: {
          percentage: -1,
          score: -1,
          normalizedTimeTakenSeconds: 1,
          createdAt: 1
        }
      },
      {
        $group: {
          _id: "$userId",
          bestAttempt: { $first: "$$ROOT" },
          totalAttempts: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$user.name",
          email: "$user.email",
          totalAttempts: 1,
          score: "$bestAttempt.score",
          totalQuestions: "$bestAttempt.totalQuestions",
          percentage: { $round: ["$bestAttempt.percentage", 2] },
          timeTakenSeconds: "$bestAttempt.normalizedTimeTakenSeconds",
          attemptedAt: "$bestAttempt.createdAt"
        }
      },
      {
        $sort: {
          percentage: -1,
          score: -1,
          timeTakenSeconds: 1,
          attemptedAt: 1
        }
      },
      { $limit: limit }
    ]);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});

module.exports = router;
