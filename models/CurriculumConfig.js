// models/CurriculumConfig.js
import mongoose from "mongoose";

const CurriculumConfigSchema = new mongoose.Schema({
  program: { type: String, required: true }, // e.g., "computerScience"
  curriculumType: { type: String, required: true }, // e.g., "Computer Science"
  header: { type: String, required: true },
  footer: { type: String, required: true },
  offsetText: { type: String, required: true },
  // Optionally, include fields for term/year information if needed.
  createdAt: { type: Date, default: Date.now },
});

export const CurriculumConfig = mongoose.model("CurriculumConfig", CurriculumConfigSchema);
