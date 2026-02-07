const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Question = require("../models/Question");
const Result = require("../models/Result");

// ==============================
// GET ALL QUESTIONS (FOR EXAM & ADMIN)
// ==============================
router.get("/questions", auth, async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

// CHECK IF USER HAS ALREADY SUBMITTED EXAM
router.get("/status", auth, async (req, res) => {
  const attempt = await Result.findOne({ userId: req.user.id });

  res.json({
    submitted: !!attempt
  });
});


// ==============================
// SUBMIT EXAM
// ==============================
router.post("/submit", auth, async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ message: "No answers submitted" });
    }

    const questions = await Question.find();

    let score = 0;

    questions.forEach(q => {
      const qid = q._id.toString();

      if (
        answers[qid] &&
        answers[qid].trim().toLowerCase() ===
        q.correctAnswer.trim().toLowerCase()
      ) {
        score++;
      }
    });

    const totalQuestions = questions.length; // 🔥 FINAL FIX

    await Result.create({
      userId: req.user.id,
      score,
      totalQuestions
    });

    res.json({
      message: "Exam submitted successfully",
      score,
      totalQuestions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Exam submission failed" });
  }
});



module.exports = router;
