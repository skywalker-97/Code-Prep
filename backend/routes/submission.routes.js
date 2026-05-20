const express = require("express");
const auth = require("../middleware/auth");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { runOnJudge0 } = require("../utils/judge0");

const router = express.Router();

const SCORE_MAP = {
  Easy: 10,
  Medium: 20,
  Hard: 30
};

function toSubmissionStatus(result) {
  if (result.statusId === 3) return "Accepted";
  if (result.statusId === 6) return "Compile Error";
  if (result.statusId === 11) return "Runtime Error";
  return "Wrong Answer";
}

router.post("/submit", auth, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({ message: "problemId, code, language are required" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const hiddenCases = problem.testCases || [];
    if (!hiddenCases.length) {
      return res.status(400).json({ message: "No test cases configured for this problem" });
    }
    let details = [];
    let overallStatus = "Accepted";
    let output = "";

    for (let i = 0; i < hiddenCases.length; i += 1) {
      const testCase = hiddenCases[i];
      const run = await runOnJudge0({
        code,
        language,
        stdin: testCase.input,
        expectedOutput: testCase.expectedOutput
      });

      output = run.stdout || run.stderr || run.compileOutput || "";
      const passed = run.passed && run.statusId === 3;
      const status = passed ? "Accepted" : toSubmissionStatus(run);

      details.push({
        testCase: i + 1,
        passed,
        expectedOutput: testCase.expectedOutput,
        actualOutput: run.stdout,
        status
      });

      if (!passed) {
        overallStatus = status;
        break;
      }
    }

    const score = overallStatus === "Accepted" ? SCORE_MAP[problem.difficulty] || 0 : 0;

    const submission = await Submission.create({
      userId: req.user.id,
      problemId: problem._id,
      code,
      language,
      status: overallStatus,
      score,
      output,
      details
    });

    return res.status(201).json(submission);
  } catch (err) {
    return res.status(503).json({
      message:
        "Submit failed. Ensure Judge0 is configured and reachable, then try again.",
      error: err.message
    });
  }
});

router.get("/history", auth, async (req, res) => {
  try {
    const history = await Submission.find({ userId: req.user.id })
      .populate("problemId", "title difficulty")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

router.get("/stats", auth, async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.id }).populate(
      "problemId",
      "difficulty"
    );

    const total = submissions.length;
    const accepted = submissions.filter((s) => s.status === "Accepted").length;
    const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);

    const solvedSet = new Set(
      submissions
        .filter((s) => s.status === "Accepted")
        .map((s) => String(s.problemId?._id))
    );

    res.json({
      totalSubmissions: total,
      acceptedSubmissions: accepted,
      solvedProblems: solvedSet.size,
      totalScore
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Submission.aggregate([
      { $match: { status: "Accepted" } },
      {
        $group: {
          _id: "$userId",
          totalScore: { $sum: "$score" },
          acceptedCount: { $sum: 1 },
          lastAcceptedAt: { $max: "$createdAt" }
        }
      },
      { $sort: { totalScore: -1, acceptedCount: -1, lastAcceptedAt: 1 } },
      { $limit: 20 },
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
          totalScore: 1,
          acceptedCount: 1,
          lastAcceptedAt: 1
        }
      }
    ]);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

module.exports = router;
