require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 5000;


connectDB();
const app = express();

const corsOptions = {
  origin: "https://code-prep-frontend-ix5g.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/exam", require("./routes/exam.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/results", require("./routes/result.routes"));


app.listen(PORT, () => console.log("Backend running on 5000"));
