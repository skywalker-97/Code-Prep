require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const app = express();

connectDB();

const exactAllowedOrigins = new Set([
  "https://code-prep-frontend-ix5g.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (exactAllowedOrigins.has(origin)) return true;
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }
  } catch (err) {
    return false;
  }
  return false;
}

app.use(
  cors({
    origin(origin, cb) {
      if (isAllowedOrigin(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api", require("./routes/auth.routes"));
app.use("/api/exam", require("./routes/exam.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/results", require("./routes/result.routes"));

app.use("/api/problems", require("./routes/problem.routes"));
app.use("/api/code", require("./routes/code.routes"));
app.use("/api/submissions", require("./routes/submission.routes"));
app.use("/api/notes", require("./routes/note.routes"));
app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/daily", require("./routes/daily.routes"));
app.use("/api/contests", require("./routes/contest.routes"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT}`)
);
