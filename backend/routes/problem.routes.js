const express = require("express");
const Problem = require("../models/Problem");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { difficulty, tag, search } = req.query;
    const query = {};

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const problems = await Problem.find(query)
      .select("title difficulty tags createdAt")
      .sort({ createdAt: -1 });

    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch problems" });
  }
});

router.get("/bookmarks/my", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "bookmarkedProblems",
      select: "title difficulty tags"
    });

    res.json(user?.bookmarkedProblems || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookmarks" });
  }
});

router.post("/", auth, adminMiddleware, async (req, res) => {
  try {
    const { title, description, difficulty, tags, testCases, starterCode } = req.body;
    if (!title || !description || !difficulty) {
      return res
        .status(400)
        .json({ message: "title, description and difficulty are required" });
    }

    const problem = await Problem.create({
      title: String(title).trim(),
      description: String(description).trim(),
      difficulty,
      tags: Array.isArray(tags) ? tags : [],
      testCases: Array.isArray(testCases) ? testCases : [],
      starterCode: starterCode || {}
    });

    res.status(201).json(problem);
  } catch (err) {
    res.status(500).json({ message: "Failed to create problem" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const safeProblem = {
      _id: problem._id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      tags: problem.tags,
      starterCode: problem.starterCode,
      testCases: (problem.testCases || [])
        .filter((tc) => !tc.isHidden)
        .map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
    };

    res.json(safeProblem);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch problem" });
  }
});

router.post("/:id/bookmark", auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const user = await User.findById(req.user.id);
    const existing = user.bookmarkedProblems.find(
      (pid) => pid.toString() === req.params.id
    );

    if (existing) {
      user.bookmarkedProblems = user.bookmarkedProblems.filter(
        (pid) => pid.toString() !== req.params.id
      );
      await user.save();
      return res.json({ bookmarked: false });
    }

    user.bookmarkedProblems.push(problem._id);
    await user.save();
    return res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update bookmark" });
  }
});

module.exports = router;
