const express = require("express");
const auth = require("../middleware/auth");
const { runOnJudge0 } = require("../utils/judge0");

const router = express.Router();

router.post("/run-code", auth, async (req, res) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: "code and language are required" });
    }

    const result = await runOnJudge0({ code, language, stdin: input || "" });

    res.json({
      status: result.statusDescription,
      output: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compileOutput
    });
  } catch (err) {
    const unavailable = String(err.message || "").includes("Judge0 failed");
    res.status(unavailable ? 503 : 400).json({
      message:
        "Run code is currently unavailable. Configure Judge0 env vars (JUDGE0_API_URL and optional RapidAPI key).",
      error: err.message
    });
  }
});

module.exports = router;
