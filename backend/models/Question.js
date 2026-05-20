const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  examId: { type: String, trim: true },
  subjectId: { type: String, trim: true },
  topicId: { type: String, trim: true },
  question: { type: String, required: true },
  questionImage: { type: String },
  options: [{ type: String }],
  optionImages: [{ type: String }],
  correctAnswer: { type: String, required: true },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  explanation: { type: String },
  questionType: { type: String, enum: ["single", "multiple", "true-false"], default: "single" },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadBatchId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Question", QuestionSchema);
