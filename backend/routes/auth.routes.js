const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ msg: "Database not connected. Start MongoDB / fix MONGO_URI." });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    if (cleanName.length < 2) {
      return res.status(400).json({ msg: "Name must be at least 2 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ msg: "Please enter a valid email address" });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const userRole = role === "admin" ? "admin" : "student";

    const user = new User({
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: userRole
    });

    await user.save();

    res.status(201).json({
      msg: `${userRole} registered successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    const isDbIssue =
      err?.name === "MongoServerSelectionError" ||
      String(err?.message || "").toLowerCase().includes("buffering timed out") ||
      String(err?.message || "").toLowerCase().includes("querysrv") ||
      String(err?.message || "").toLowerCase().includes("etimeout");
    if (isDbIssue) {
      return res.status(503).json({ msg: "Database connection failed. Check MONGO_URI / network." });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ msg: "Database not connected. Start MongoDB / fix MONGO_URI." });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const match = await bcrypt.compare(cleanPassword, user.password);

    if (!match) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
});

router.post("/change", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ msg: "currentPassword and newPassword are required" });
    }

    const cleanCurrent = String(currentPassword).trim();
    const cleanNew = String(newPassword).trim();

    if (cleanNew.length < 6) {
      return res
        .status(400)
        .json({ msg: "New password must be at least 6 characters" });
    }

    if (cleanCurrent === cleanNew) {
      return res
        .status(400)
        .json({ msg: "New password must be different from current password" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(cleanCurrent, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    user.password = cleanNew;
    await user.save();

    return res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
