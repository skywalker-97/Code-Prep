const express = require("express");
const Question = require("../models/Question");
const Result = require("../models/Result");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/questions", auth, async (req, res) => {
  res.json(await Question.find());
});

router.post("/submit", auth, async (req, res) => {
  const questions = await Question.find();
  let score = 0;

  questions.forEach((q, i) => {
    if (q.correctAnswer === req.body.answers[i]) score++;
  });

  await Result.create({ userId: req.user.id, score });
  res.json({ score });
});

module.exports = router;
