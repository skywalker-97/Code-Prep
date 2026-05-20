const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const xss = require("xss");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/adminMiddleware");
const User = require("../models/User");
const Question = require("../models/Question");
const Result = require("../models/Result");
const ExamSetting = require("../models/ExamSetting");
const UploadAudit = require("../models/UploadAudit");

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const bulkUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { message: "Too many bulk uploads, please try again after 10 minutes" }
});

const DEFAULT_TIMER_SECONDS = 300;

async function getOrCreateSettings() {
  let settings = await ExamSetting.findOne();
  if (!settings) {
    settings = await ExamSetting.create({ timerSeconds: DEFAULT_TIMER_SECONDS });
  }
  return settings;
}

router.use(auth, requireAdmin);

router.get("/stats", async (req, res) => {
  try {
    const [questions, students, attempts, avgScoreStats, avgPercentageStats, settings] =
      await Promise.all([
        Question.countDocuments(),
        User.countDocuments({ role: "student" }),
        Result.countDocuments(),
        Result.aggregate([
          {
            $group: {
              _id: null,
              avgScore: { $avg: "$score" }
            }
          }
        ]),
        Result.aggregate([
          {
            $project: {
              percent: {
                $cond: [
                  { $gt: ["$totalQuestions", 0] },
                  { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] },
                  0
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgPercentage: { $avg: "$percent" }
            }
          }
        ]),
        getOrCreateSettings()
      ]);

    res.json({
      questions,
      students,
      attempts,
      timerSeconds: settings.timerSeconds,
      averageScore: Number((avgScoreStats[0]?.avgScore || 0).toFixed(2)),
      averagePercentage: Number((avgPercentageStats[0]?.avgPercentage || 0).toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/settings", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ timerSeconds: settings.timerSeconds });
  } catch (err) {
    res.status(500).json({ message: "Failed to load settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const timerSeconds = Number(req.body.timerSeconds);
    if (!Number.isFinite(timerSeconds) || timerSeconds < 30 || timerSeconds > 7200) {
      return res.status(400).json({ message: "Timer must be between 30 and 7200 seconds" });
    }

    const settings = await getOrCreateSettings();
    settings.timerSeconds = Math.floor(timerSeconds);
    await settings.save();

    res.json({ message: "Settings updated", timerSeconds: settings.timerSeconds });
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings" });
  }
});

router.get("/attempts", async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 500);
    const attempts = await Result.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email");

    const mapped = attempts.map((attempt) => ({
      id: attempt._id,
      userId: attempt.userId?._id,
      name: attempt.userId?.name || "Unknown",
      email: attempt.userId?.email || "Unknown",
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage:
        attempt.totalQuestions > 0
          ? Number(((attempt.score / attempt.totalQuestions) * 100).toFixed(2))
          : 0,
      timeTakenSeconds: attempt.timeTakenSeconds || 0,
      attemptedAt: attempt.createdAt
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: "Failed to load attempts" });
  }
});

router.post("/question", async (req, res) => {
  const { question, options, correctAnswer } = req.body;
  const q = new Question({ question, options, correctAnswer });
  await q.save();
  res.json({ message: "Question added" });
});

router.delete("/question/:id", async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.json({ message: "Question deleted" });
});

function normalizeString(str) {
  if (!str) return "";
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

router.post("/questions/bulk-upload", bulkUploadLimiter, upload.single("file"), async (req, res) => {
  try {
    let questionsData = [];
    const transactionMode = req.body.transactionMode || "partial";
    console.log(`[BulkUpload] Start. Mode: ${transactionMode}`);
    
    if (req.file) {
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      questionsData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else if (req.body.questions) {
      questionsData = typeof req.body.questions === 'string' ? JSON.parse(req.body.questions) : req.body.questions;
    } else {
      return res.status(400).json({ message: "No questions provided" });
    }

    if (!Array.isArray(questionsData) || questionsData.length === 0) {
      return res.status(400).json({ message: "Empty questions list" });
    }
    if (questionsData.length > 500) {
      return res.status(400).json({ message: "Max limit of 500 questions per upload" });
    }

    const batchId = crypto.randomUUID();
    let successRows = 0;
    let failedRows = 0;
    const errors = [];
    const validDocs = [];

    // Check existing questions to prevent duplicates
    const existingQuestions = await Question.find({}, 'question');
    const existingSet = new Set(existingQuestions.map(q => normalizeString(q.question)));

    for (let i = 0; i < questionsData.length; i++) {
      const row = questionsData[i];
      let rowNum = i + 1;
      try {
        const qText = row.question ? row.question.toString().trim() : "";
        if (!qText) throw new Error("Missing question text");
        
        const normQ = normalizeString(qText);
        if (existingSet.has(normQ)) {
          throw new Error("Duplicate question detected");
        }
        
        const optA = row.optionA ? row.optionA.toString().trim() : "";
        const optB = row.optionB ? row.optionB.toString().trim() : "";
        const optC = row.optionC ? row.optionC.toString().trim() : "";
        const optD = row.optionD ? row.optionD.toString().trim() : "";
        const options = [optA, optB, optC, optD].filter(Boolean);
        
        if (options.length < 2) throw new Error("At least 2 options required");
        
        const correct = row.correctAnswer ? row.correctAnswer.toString().trim() : "";
        const isMatch = options.some(opt => opt.toLowerCase() === correct.toLowerCase());
        if (!isMatch) throw new Error("Correct answer does not match any option exactly");
        
        const newDoc = {
          examId: req.body.examId || row.examId || "",
          subjectId: req.body.subjectId || row.subjectId || "",
          topicId: req.body.topicId || row.topicId || "",
          question: xss(qText),
          options: options.map(o => xss(o)),
          correctAnswer: xss(correct),
          marks: Number(row.marks) || 1,
          negativeMarks: Number(row.negativeMarks) || 0,
          explanation: row.explanation ? xss(row.explanation.toString()) : "",
          difficulty: row.difficulty || req.body.difficulty || "Medium",
          questionType: row.questionType || "single",
          createdBy: req.user.id,
          uploadBatchId: batchId
        };
        
        validDocs.push(newDoc);
        existingSet.add(normQ); // prevent duplicates within the same batch
      } catch (err) {
        failedRows++;
        errors.push({ row: rowNum, error: err.message, data: row });
      }
    }

    if (transactionMode === "all_or_nothing" && failedRows > 0) {
      await UploadAudit.create({
        batchId,
        uploadedBy: req.user.id,
        totalRows: questionsData.length,
        successRows: 0,
        failedRows: questionsData.length,
        mode: transactionMode,
        status: "Failed"
      });
      return res.status(400).json({ 
        message: "Upload failed (All-or-Nothing mode). Please fix errors.", 
        errors 
      });
    }

    if (validDocs.length > 0) {
      await Question.insertMany(validDocs);
      successRows = validDocs.length;
    }

    await UploadAudit.create({
      batchId,
      uploadedBy: req.user.id,
      totalRows: questionsData.length,
      successRows,
      failedRows,
      mode: transactionMode,
      status: successRows > 0 ? "Success" : "Failed"
    });

    console.log(`[BulkUpload] Finished. Success: ${successRows}, Failed: ${failedRows}`);
    res.json({
      message: `Successfully uploaded ${successRows} questions. Failed: ${failedRows}`,
      successRows,
      failedRows,
      errors
    });

  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ message: "Server error during bulk upload" });
  }
});

router.post("/questions/rollback/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;
    const audit = await UploadAudit.findOne({ batchId });
    if (!audit) return res.status(404).json({ message: "Audit log not found" });
    if (audit.status === "RolledBack") return res.status(400).json({ message: "Already rolled back" });

    const result = await Question.deleteMany({ uploadBatchId: batchId });
    audit.status = "RolledBack";
    await audit.save();

    res.json({ message: `Rollback successful. Removed ${result.deletedCount} questions.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to rollback" });
  }
});

router.get("/questions/audits", async (req, res) => {
  try {
    const audits = await UploadAudit.find().sort({ createdAt: -1 }).populate("uploadedBy", "name email");
    res.json(audits);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audits" });
  }
});

module.exports = router;
