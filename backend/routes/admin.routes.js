const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const User = require("../models/User");
const Question = require("../models/Question");
const Result = require("../models/Result");

// ===== ADMIN STATS ROUTE =====
router.get("/stats", auth, async (req, res) => {
  try {
    const questions = await Question.countDocuments();
    const students = await User.countDocuments({ role: "student" });
    const attempts = await Result.countDocuments();

    res.json({
      questions,
      students,
      attempts
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ADD QUESTION
router.post("/question", auth, async (req, res) => {
  const { question, options, correctAnswer } = req.body;

  const q = new Question({ question, options, correctAnswer });
  await q.save();

  res.json({ message: "Question added" });
});

// DELETE QUESTION
router.delete("/question/:id", auth, async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.json({ message: "Question deleted" });
});


module.exports = router;
