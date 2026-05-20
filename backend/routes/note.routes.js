const express = require("express");
const auth = require("../middleware/auth");
const Note = require("../models/Note");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const query = { userId: req.user.id };
    if (req.query.topic) {
      query.topic = { $regex: req.query.topic, $options: "i" };
    }

    const notes = await Note.find(query).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { topic, content } = req.body;
    if (!topic || !content) {
      return res.status(400).json({ message: "topic and content are required" });
    }

    const note = await Note.create({
      userId: req.user.id,
      topic: String(topic).trim(),
      content: String(content).trim()
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: "Failed to create note" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { topic, content } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        ...(topic ? { topic: String(topic).trim() } : {}),
        ...(content ? { content: String(content).trim() } : {})
      },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Failed to update note" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete note" });
  }
});

module.exports = router;
