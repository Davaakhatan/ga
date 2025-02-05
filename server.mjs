import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import mongoose from "mongoose";
import mammoth from "mammoth"; // Import mammoth library

// Import your Mongoose model for the data you want to store
import { Course } from "./models/course.js";
import { Catalog } from "./models/catalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

// Define storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Set upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use original filename
  },
});

// Initialize multer with defined storage
const upload = multer({ storage: storage });

// const fs = require("fs");

// Function to parse DOCX file data and save as JSON
async function parseDOCXFile(filePath) {
  try {
    const { value } = await mammoth.extractRawText({ path: filePath });
    
    let curriculumType;
    let startIndex;
    let endIndex;
    let startIndexAdjusted;

    if (value.includes("Computer Science Curriculum")) {
      curriculumType = "Computer Science";
      startIndex = value.indexOf("Computer Science Curriculum");
      startIndexAdjusted = startIndex + "Computer Science Curriculum\n(Numerals in front of courses indicate credits)\n".length;
      endIndex = value.indexOf("Total Credits: 129", startIndex);
    } else if (value.includes("Cybersecurity Curriculum")) {
      curriculumType = "Cybersecurity";
      startIndex = value.indexOf("Cybersecurity Curriculum");
      startIndexAdjusted = startIndex + "Cybersecurity Curriculum\n(Numerals in front of courses indicate credits)\n".length;
      endIndex = value.indexOf("Total Credits: 126", startIndex);
    } else if (value.includes("Software Engineering Curriculum")) {
      curriculumType = "Software Engineering";
      startIndex = value.indexOf("Software Engineering Curriculum");
      startIndexAdjusted = startIndex + "Software Engineering Curriculum\n(Numerals in front of courses indicate credits)\n".length;
      endIndex = value.indexOf("Total Credits: 129", startIndex);
    } else {
      throw new Error("Unknown curriculum type");
    }

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Failed to find curriculum text");
    }

    const relevantText = value.substring(startIndexAdjusted, endIndex);
    console.log("Relevant text:", relevantText);

    const lines = relevantText.split("\n").filter((line) => line.trim() !== "");

    const catalog = {
      curriculumType: curriculumType,
      FRESHMAN: { Fall: [], Spring: [] },
      SOPHOMORE: { Fall: [], Spring: [] },
      JUNIOR: { Fall: [], Spring: [] },
      SENIOR: { Fall: [], Spring: [] }
    };

    let currentYear = null;
    let currentSemester = null;

    for (const line of lines) {
      if (
        line.includes("FRESHMAN") ||
        line.includes("SOPHOMORE") ||
        line.includes("JUNIOR") ||
        line.includes("SENIOR") ||
        line.includes("GRADUATE")
      ) {
        currentYear = line.trim();
      } else if (line.includes("Fall") || line.includes("Spring")) {
        currentSemester = line.trim();
      } else {
        let parts = line.split(/\t+/); // Split by one or more tabs
        if (parts.length >= 2) {
          let credits = parseInt(parts[0]);
          const course = parts.slice(1).join(" ").trim();
          if (!isNaN(credits) && course !== "") {
            catalog[currentYear][currentSemester].push({ credits, course });
          } else {
            // Skip invalid lines
            console.warn(`Skipping invalid course entry: ${line}`);
          }
        } else {
          // Handle specific cases
          if (line.includes("Intro to Engineering/ENG 102")) {
            catalog["FRESHMAN"]["Fall"].push({ credits: 1, course: "Intro to Engineering/ENG 102" });
          } else if (line.includes("Problem Solv. and Computer Prog./ CIS 180")) {
            catalog["FRESHMAN"]["Fall"].push({ credits: 2, course: "Problem Solv. and Computer Prog./ CIS 180" });
          } else {
            // Skip other invalid lines
            console.warn(`Skipping invalid line: ${line}`);
          }
        }
      }
    }

    console.log("Catalog:", JSON.stringify(catalog, null, 2));
    return catalog;
  } catch (error) {
    throw new Error("Error parsing DOCX file: " + error.message);
  }
}


// Function to parse XLSX file data
async function parseXLSXFile(filePath) {
  try {
    // Read the XLSX file
    const workbook = xlsx.readFile(filePath);
    // Get the first sheet of the workbook
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // Convert the sheet data to JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    // Transform the JSON data 
    const transformedData = jsonData.map((item) => ({
      COURSE_NUMBER: item["COURSE #"],
      TITLE_START_DATE: item["TITLE/START DATE"],
      ACADEMIC_LEVEL: item["Acad Level"],
      CAPACITY: item["CAPACITY"],
      NUMBER_OF_STUDENTS: item["# OF STUDENTS"],
      STATUS: item["STATUS"],
      INSTRUCTOR: item["INSTRUCTOR"],
      START_TIME: item["Start Time"],
      END_TIME: item["End Time"],
      MEETING_DAYS: item["Meeting Days"],
      BUILDING: item["Bldg"],
      ROOM: item["Room"] ? item["Room"].trim() : "N/A",
      FEE: item["FEE"],
      MIN_CREDITS: item["Min Cred"],
      MAX_CREDITS: item["Max Cred"],
      SECTION: item["Section"],
      TERM: item["Term"],
      SEQ_NO: item["Seq No"],
      SCHOOLS: item["Schools"],
      ACADEMIC_LEVEL_1: item["Acad Level_1"],
    }));
    return transformedData;
  } catch (error) {
    throw new Error("Error parsing XLSX file: " + error.message);
  }
}

app.post("/api/upload/:term", upload.single("file"), async (req, res) => {
  const { term } = req.params;
  console.log("Received term:", term); // For debugging
  try {
    if (req.file.originalname.endsWith(".docx")) {
      const catalogData = await parseDOCXFile(req.file.path);
      await Catalog.deleteMany({ curriculumType: catalogData.curriculumType });
      await Catalog.create(catalogData);
      fs.unlinkSync(req.file.path);
      return res.status(200).json({ success: true, message: "DOCX file processed and saved successfully" });
    } else if (req.file.originalname.endsWith(".xlsx")) {
      const transformedData = await parseXLSXFile(req.file.path);
      await Promise.all(
        transformedData.map((course) =>
          Course.findOneAndUpdate(
            { COURSE_NUMBER: course.COURSE_NUMBER, TERM: term },
            course,
            { upsert: true, new: true }
          )
        )
      );
      fs.unlinkSync(req.file.path);
      return res.status(200).json({ success: true, message: "XLSX file processed and saved successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Unsupported file type" });
    }
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ success: false, message: "An error occurred during upload" });
  }
});



// Retrieve filtered courses based on course number prefix, selected year, and term (semester)
app.get("/api/courses", async (req, res) => {
  try {
    const { year, semester, course } = req.query; // Add course to the query params

    // Initialize filter based on the selected semester (fall or spring)
    let courseFilter = {};

    // Set TERM filtering for fall or spring
    courseFilter.TERM = semester === 'fall' ? { $regex: /\/FA$/ } : { $regex: /\/SP$/ };

    // Filter by course type and year, and set COURSE_NUMBER regex based on the semester
    if (course === 'computer-science') {
      switch (year) {
        case 'freshman':
          courseFilter.COURSE_NUMBER = semester === 'fall'
            ? { $regex: /^(CIS_180|CIS_290|MATH_140)/, $options: "i" }
            : { $regex: /^(CIS_182|CIS_183|MATH_141|PHYS_210|PHYS_211)/, $options: "i" };
          break;
        case 'sophomore':
          courseFilter.COURSE_NUMBER = semester === 'fall'
            ? { $regex: /^(CSC_220|CIS_239|CIS_287|CIS_277|MATH_222)/, $options: "i" }
            : { $regex: /^(CIS_255|CSC_223|SOFT_210|MATH_223|MATH_314|PHYS_214|PHYS_212|PHYS_215|PHYS_213)/, $options: "i" };
          break;
        case 'junior':
          courseFilter.COURSE_NUMBER = semester === 'fall'
            ? { $regex: /^(CIS_355|CIS_326|CIS_219|MATH_213)/, $options: "i" }
            : { $regex: /^(MATH_310|PHYS_212)/, $options: "i" };
          break;
        case 'senior':
          courseFilter.COURSE_NUMBER = semester === 'fall'
            ? { $regex: /^(CIS_457|CSC_360|CIS_387|CSC_330)/, $options: "i" }
            : { $regex: /^(CIS_458|CIS_390)/, $options: "i" };
          break;
        case 'graduate':
          courseFilter.COURSE_NUMBER = { $regex: /^$/ }; // No courses for Graduate
          break;
        default:
          return res.status(400).json({ success: false, message: "Invalid year selected" });
      }
    } else if (course === 'cybersecurity') {
      switch (year) {
        case 'freshman':
          courseFilter.COURSE_NUMBER = semester === 'fall'
            ? { $regex: /^(CIS_180|CIS_181|CIS_290|CIS_240|MATH_112|MATH_140)/, $options: "i" }
            : { $regex: /^(CYB_103|CYB_104)/, $options: "i" };
          break;
        case 'sophomore':
          courseFilter.COURSE_NUMBER = semester === 'fall'
            ? { $regex: /^(CYB_201|CYB_202)/, $options: "i" }
            : { $regex: /^(CYB_203|CYB_204)/, $options: "i" };
          break;
        case 'junior':
          courseFilter.COURSE_NUMBER = semester === 'fall'
            ? { $regex: /^(CYB_301|CYB_302)/, $options: "i" }
            : { $regex: /^(CYB_303|CYB_304)/, $options: "i" };
          break;
        case 'senior':
          courseFilter.COURSE_NUMBER = semester === 'fall'
            ? { $regex: /^(CYB_401|CYB_402)/, $options: "i" }
            : { $regex: /^(CYB_403|CYB_404)/, $options: "i" };
          break;
        case 'graduate':
          courseFilter.COURSE_NUMBER = { $regex: /^$/ }; // No courses for Graduate
          break;
        default:
          return res.status(400).json({ success: false, message: "Invalid year selected" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid course type selected" });
    }

    // Log the filter for debugging purposes
    console.log("Generated course filter:", JSON.stringify(courseFilter, null, 2));

    // Fetch the filtered courses from the database
    const courses = await Course.find(courseFilter);
    res.json(courses);
  } catch (error) {
    console.error("Error retrieving courses:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving courses",
    });
  }
});




// Retrieve catalog data by curriculum type
app.get("/api/catalog/:curriculumType", async (req, res) => {
  try {
    const catalog = await Catalog.findOne({ curriculumType: req.params.curriculumType });

    if (!catalog) {
      return res.status(404).json({ success: false, message: "Catalog not found" });
    }

    res.json(catalog);
  } catch (error) {
    console.error("Error retrieving catalog:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving catalog data",
    });
  }
});


// Retrieve course by ID
app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    console.error("Error retrieving course:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving course",
    });
  }
});

// Update course details
app.put("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourse = req.body;

    // Ensure we are updating the correct document by filtering with _id
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Ensure the update does not create a duplicate
    const conflictCourse = await Course.findOne({
      COURSE_NUMBER: updatedCourse.COURSE_NUMBER,
      TERM: updatedCourse.TERM,
      ROOM: updatedCourse.ROOM,
      MEETING_DAYS: updatedCourse.MEETING_DAYS,
      _id: { $ne: id }, // Exclude the current course from duplicate check
    });

    if (conflictCourse) {
      return res.status(400).json({ success: false, message: "Duplicate entry detected for another course" });
    }

    // Perform safe update
    const result = await Course.findByIdAndUpdate(id, updatedCourse, { new: true, runValidators: true });

    if (!result) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, message: "Course updated successfully", data: result });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ success: false, message: "An error occurred while updating the course" });
  }
});




// Delete a course by ID
app.delete("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.findByIdAndDelete(id);
    
    if (!deletedCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, message: "Course deleted successfully", deletedCourse });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ success: false, message: "An error occurred while deleting the course" });
  }
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/coursesDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", (error) => console.error("MongoDB connection error:", error));
db.once("open", () => console.log("Connected to MongoDB"));


