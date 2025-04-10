// models/Curriculum.js
import mongoose from "mongoose";

const CurriculumSchema = new mongoose.Schema({
  program: {
    type: String,
    enum: [
      "Computer Science",
      "Cybersecurity",
      "Software Engineering",
      "Software Engineering Dual Degree",
    ],
    required: true,
  },
  year: {
    type: String,
    enum: ["Freshman", "Sophomore", "Junior", "Senior, Graduate"],
    required: true,
  },
  term: {
    type: String,
    enum: ["Fall", "Spring"],
    required: true,
  },
  // An example field to hold the catalog or courses for that curriculum.
  // This can be adjusted based on your data structure.
  courses: [
    {
      courseName: { type: String, required: true },
      credits: { type: Number, required: true },
      description: { type: String },
      // You might store additional fields like room, meeting days, etc.
    },
  ],
  // Any extra configuration settings you need (e.g., headers, footers, offset text)
  header: { type: String },
  footer: { type: String },
  offsetText: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Curriculum = mongoose.model("Curriculum", CurriculumSchema);
