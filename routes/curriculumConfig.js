// routes/curriculumConfig.js
import express from "express";
import { CurriculumConfig } from "../models/CurriculumConfig.js";

const router = express.Router();

// Create new curriculum config
router.post("/", async (req, res) => {
  try {
    const config = await CurriculumConfig.create(req.body);
    res.json({ success: true, data: config });
  } catch (error) {
    console.error("Error creating config:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all curriculum configs
router.get("/", async (req, res) => {
  try {
    const configs = await CurriculumConfig.find();
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error("Error fetching configs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a curriculum config
router.put("/:id", async (req, res) => {
  try {
    const updated = await CurriculumConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating config:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a curriculum config
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await CurriculumConfig.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: deleted });
  } catch (error) {
    console.error("Error deleting config:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
