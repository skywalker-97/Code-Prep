const mongoose = require("mongoose");

const ExamSettingSchema = new mongoose.Schema(
  {
    timerSeconds: {
      type: Number,
      default: 300,
      min: 30,
      max: 7200
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamSetting", ExamSettingSchema);
