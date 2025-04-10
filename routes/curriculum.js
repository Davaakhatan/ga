// routes/curriculum.js
import express from "express";
import { Curriculum } from "../models/Curriculum.js";

const router = express.Router();

// Create a new curriculum configuration
router.post("/", async (req, res) => {
  try {
    const newCurriculum = await Curriculum.create(req.body);
    res.json({ success: true, data: newCurriculum });
  } catch (error) {
    console.error("Error creating curriculum:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all curriculum configurations
router.get("/", async (req, res) => {
  try {
    const curricula = await Curriculum.find();
    res.json({ success: true, data: curricula });
  } catch (error) {
    console.error("Error fetching curricula:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a curriculum configuration
router.put("/:id", async (req, res) => {
  try {
    const updated = await Curriculum.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating curriculum:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a curriculum configuration
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Curriculum.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: deleted });
  } catch (error) {
    console.error("Error deleting curriculum:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
