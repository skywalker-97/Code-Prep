require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const app = express();

// ✅ Connect Database
connectDB();

// ✅ CORS Configuration (Production Safe)
app.use(cors({
  origin: "https://code-prep-frontend-ix5g.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api", require("./routes/auth.routes"));
app.use("/api/exam", require("./routes/exam.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/results", require("./routes/result.routes"));

// ✅ Test Route (optional but helpful)
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Start Server
app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT}`)
);
