const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Result",
  new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    score: Number
  })
);
