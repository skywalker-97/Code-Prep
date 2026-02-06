require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/exam", require("./routes/exam.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/results", require("./routes/result.routes"));


app.listen(5000, () => console.log("Backend running on 5000"));
