const express = require("express");
const auth = require("../middleware/auth");
const DailyChallenge = require("../models/DailyChallenge");
const DailyProgress = require("../models/DailyProgress");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const User = require("../models/User");

const router = express.Router();

function formatDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayBefore(dateKey) {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function getOrCreateTodayChallenge() {
  const today = formatDateKey();
  let challenge = await DailyChallenge.findOne({ challengeDate: today }).populate(
    "problemId",
    "title difficulty tags"
  );

  if (challenge) return challenge;

  const candidates = await Problem.find().select("_id title difficulty tags");
  if (!candidates.length) {
    throw new Error("No problems available to create daily challenge");
  }

  const index = Math.floor(Math.random() * candidates.length);
  challenge = await DailyChallenge.create({
    challengeDate: today,
    problemId: candidates[index]._id
  });

  return DailyChallenge.findById(challenge._id).populate("problemId", "title difficulty tags");
}

router.get("/today", auth, async (req, res) => {
  try {
    const challenge = await getOrCreateTodayChallenge();
    const progress = await DailyProgress.findOne({ userId: req.user.id });

    const solvedToday = Boolean(progress?.solvedDates?.includes(challenge.challengeDate));

    res.json({
      challenge,
      solvedToday,
      streak: progress?.currentStreak || 0,
      longestStreak: progress?.longestStreak || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load daily challenge" });
  }
});

router.post("/mark-solved", auth, async (req, res) => {
  try {
    const challenge = await getOrCreateTodayChallenge();
    const accepted = await Submission.findOne({
      userId: req.user.id,
      problemId: challenge.problemId._id,
      status: "Accepted"
    }).sort({ createdAt: -1 });

    if (!accepted) {
      return res.status(400).json({ message: "Solve and submit accepted solution first" });
    }

    let progress = await DailyProgress.findOne({ userId: req.user.id });
    if (!progress) {
      progress = await DailyProgress.create({ userId: req.user.id });
    }

    const today = challenge.challengeDate;
    if (progress.solvedDates.includes(today)) {
      return res.json({
        message: "Already marked solved for today",
        streak: progress.currentStreak,
        longestStreak: progress.longestStreak
      });
    }

    const shouldIncrement = progress.lastSolvedDate === dayBefore(today);
    progress.currentStreak = shouldIncrement ? progress.currentStreak + 1 : 1;
    progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
    progress.lastSolvedDate = today;
    progress.solvedDates.push(today);
    await progress.save();

    return res.json({
      message: "Daily challenge completed",
      streak: progress.currentStreak,
      longestStreak: progress.longestStreak
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to mark challenge solved" });
  }
});

router.post("/set-today", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { problemId } = req.body;
    if (!problemId) {
      return res.status(400).json({ message: "problemId is required" });
    }

    const today = formatDateKey();
    let challenge = await DailyChallenge.findOne({ challengeDate: today });

    if (challenge) {
      challenge.problemId = problemId;
      await challenge.save();
    } else {
      challenge = await DailyChallenge.create({
        challengeDate: today,
        problemId: problemId
      });
    }

    res.json({ message: "Daily challenge updated successfully", challenge });
  } catch (err) {
    res.status(500).json({ message: "Failed to set daily challenge" });
  }
});

module.exports = router;
