const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    problemIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
        required: true
      }
    ],
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contest", contestSchema);
