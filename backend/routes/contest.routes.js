const express = require("express");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const Contest = require("../models/Contest");
const Problem = require("../models/Problem");
const ContestSubmission = require("../models/ContestSubmission");
const { runOnJudge0 } = require("../utils/judge0");

const router = express.Router();

const SCORE_MAP = {
  Easy: 10,
  Medium: 20,
  Hard: 30
};

function now() {
  return new Date();
}

function submissionStatusFromRun(run, passed) {
  if (passed && run.statusId === 3) return "Accepted";
  if (run.statusId === 6) return "Compile Error";
  if (run.statusId === 11) return "Runtime Error";
  return "Wrong Answer";
}

router.post("/", auth, adminMiddleware, async (req, res) => {
  try {
    const { title, description, startTime, endTime, problemIds } = req.body;
    if (!title || !startTime || !endTime || !Array.isArray(problemIds) || !problemIds.length) {
      return res.status(400).json({ message: "title, startTime, endTime and problemIds are required" });
    }

    const count = await Problem.countDocuments({ _id: { $in: problemIds } });
    if (count !== problemIds.length) {
      return res.status(400).json({ message: "Some problemIds are invalid" });
    }

    const contest = await Contest.create({
      title,
      description,
      startTime,
      endTime,
      problemIds
    });

    res.status(201).json(contest);
  } catch (err) {
    res.status(500).json({ message: "Failed to create contest" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const contests = await Contest.find({ isPublic: true })
      .select("title description startTime endTime problemIds")
      .sort({ startTime: -1 });

    const timeNow = now();
    const withStatus = contests.map((contest) => {
      let status = "upcoming";
      if (timeNow >= contest.startTime && timeNow <= contest.endTime) status = "live";
      if (timeNow > contest.endTime) status = "ended";
      return {
        ...contest.toObject(),
        status,
        problemCount: contest.problemIds.length
      };
    });

    res.json(withStatus);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch contests" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate(
      "problemIds",
      "title difficulty tags description"
    );
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    const timeNow = now();
    let status = "upcoming";
    if (timeNow >= contest.startTime && timeNow <= contest.endTime) status = "live";
    if (timeNow > contest.endTime) status = "ended";

    return res.json({
      ...contest.toObject(),
      status,
      serverTime: timeNow.toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch contest" });
  }
});

router.post("/:id/submit", auth, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    if (!problemId || !code || !language) {
      return res.status(400).json({ message: "problemId, code, language are required" });
    }

    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    const current = now();
    if (current < contest.startTime || current > contest.endTime) {
      return res.status(400).json({ message: "Contest is not currently live" });
    }

    const belongs = contest.problemIds.some((pid) => String(pid) === String(problemId));
    if (!belongs) {
      return res.status(400).json({ message: "Problem does not belong to this contest" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem || !problem.testCases?.length) {
      return res.status(400).json({ message: "Problem/test cases missing" });
    }

    let finalStatus = "Accepted";
    for (const testCase of problem.testCases) {
      const run = await runOnJudge0({
        code,
        language,
        stdin: testCase.input,
        expectedOutput: testCase.expectedOutput
      });
      const passed = run.passed;
      finalStatus = submissionStatusFromRun(run, passed);
      if (!passed || run.statusId !== 3) {
        break;
      }
    }

    const score = finalStatus === "Accepted" ? SCORE_MAP[problem.difficulty] || 0 : 0;

    const submission = await ContestSubmission.create({
      contestId: contest._id,
      userId: req.user.id,
      problemId,
      code,
      language,
      status: finalStatus,
      score
    });

    return res.status(201).json(submission);
  } catch (err) {
    return res.status(500).json({ message: "Contest submission failed", error: err.message });
  }
});

router.get("/:id/leaderboard", auth, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    const leaderboard = await ContestSubmission.aggregate([
      { $match: { contestId: contest._id, status: "Accepted" } },
      {
        $group: {
          _id: "$userId",
          totalScore: { $sum: "$score" },
          solvedCount: { $sum: 1 },
          lastAcceptedAt: { $max: "$createdAt" }
        }
      },
      { $sort: { totalScore: -1, solvedCount: -1, lastAcceptedAt: 1 } },
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
          solvedCount: 1,
          lastAcceptedAt: 1
        }
      },
      { $limit: 50 }
    ]);

    return res.json(leaderboard);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch contest leaderboard" });
  }
});

module.exports = router;
