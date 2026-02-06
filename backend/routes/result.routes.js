const express = require("express");
const Result = require("../models/Result");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/my-results", auth, async (req, res) => {
  const results = await Result.find({ userId: req.user.id });
  res.json(results);
});

module.exports = router;
