const express = require("express");
const auth = require("../middleware/auth");
const { getCodeReview } = require("../services/aiReview");

const router = express.Router();

router.post("/review", auth, async (req, res) => {
  try {
    const { code, language = "javascript", prompt = "" } = req.body;

    if (!code) {
      return res.status(400).json({ message: "code is required" });
    }

    const review = await getCodeReview({ code, language, prompt });
    return res.json(review);
  } catch (err) {
    return res.status(500).json({ message: "AI review failed", error: err.message });
  }
});

module.exports = router;
