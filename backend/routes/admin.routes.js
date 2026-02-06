const express = require("express");
const Question = require("../models/Question");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/add-question", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Access denied" });

  await Question.create(req.body);
  res.json({ msg: "Question added" });
});

module.exports = router;
