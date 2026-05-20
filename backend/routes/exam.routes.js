const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Question = require("../models/Question");
const Result = require("../models/Result");
const ExamSetting = require("../models/ExamSetting");

const DEFAULT_TIMER_SECONDS = 300;

async function getExamSettings() {
  let settings = await ExamSetting.findOne();
  if (!settings) {
    settings = await ExamSetting.create({ timerSeconds: DEFAULT_TIMER_SECONDS });
  }
  return settings;
}

router.get("/questions", auth, async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

router.get("/config", auth, async (req, res) => {
  try {
    const settings = await getExamSettings();
    res.json({ timerSeconds: settings.timerSeconds });
  } catch (err) {
    res.status(500).json({ message: "Failed to load exam config" });
  }
});

router.get("/status", auth, async (req, res) => {
  try {
    const attempt = await Result.findOne({ userId: req.user.id });
    res.json({ submitted: !!attempt });
  } catch (err) {
    res.status(500).json({ message: "Failed to check submission status" });
  }
});

router.post("/submit", auth, async (req, res) => {
  try {
    const { answers, timeTakenSeconds } = req.body;

    const existingAttempt = await Result.findOne({ userId: req.user.id });
    if (existingAttempt) {
      return res.status(409).json({ message: "Exam already submitted" });
    }

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ message: "No answers submitted" });
    }

    const questions = await Question.find();
    if (!questions.length) {
      return res.status(400).json({ message: "No questions available for exam" });
    }

    let score = 0;
    questions.forEach((q) => {
      const qid = q._id.toString();
      if (
        answers[qid] &&
        answers[qid].trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      ) {
        score += 1;
      }
    });

    const settings = await getExamSettings();
    const safeTimeTaken = Number.isFinite(timeTakenSeconds)
      ? Math.max(0, Math.min(Math.floor(timeTakenSeconds), settings.timerSeconds))
      : 0;

    const totalQuestions = questions.length;
    const result = await Result.create({
      userId: req.user.id,
      score,
      totalQuestions,
      timeTakenSeconds: safeTimeTaken
    });

    res.json({
      message: "Exam submitted successfully",
      score: result.score,
      totalQuestions: result.totalQuestions,
      timeTakenSeconds: result.timeTakenSeconds
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Exam submission failed" });
  }
});

module.exports = router;
