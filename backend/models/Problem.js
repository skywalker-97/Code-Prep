const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true
    },
    tags: {
      type: [String],
      default: []
    },
    starterCode: {
      javascript: { type: String, default: "function solve(input) {\n  return input;\n}" },
      python: { type: String, default: "def solve(input):\n    return input" },
      cpp: {
        type: String,
        default:
          "#include <bits/stdc++.h>\nusing namespace std;\n\nstring solve(string input) {\n    return input;\n}\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    string input, line;\n    while (getline(cin, line)) {\n        input += line;\n        if (!cin.eof()) input += \\\"\\n\\\";\n    }\n    cout << solve(input);\n    return 0;\n}"
      }
    },
    testCases: [
      {
        input: {
          type: String,
          required: true
        },
        expectedOutput: {
          type: String,
          required: true
        },
        isHidden: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Problem", problemSchema);
