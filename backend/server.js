require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 5000;

const auth = require("./routes/auth.routes");
connectDB();
const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", require("./routes/auth.routes"));

app.use("/api/exam", require("./routes/exam.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/results", require("./routes/result.routes"));


app.listen(PORT, () =>
  console.log(`Backend running on ${PORT}`)
);

