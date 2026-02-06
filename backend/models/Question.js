const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Question",
  new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: Number
  })
);
