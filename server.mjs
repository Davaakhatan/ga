import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import mongoose from "mongoose";
import mammoth from "mammoth";

// Import your Mongoose models
import { Course } from "./models/course.js";
import { Catalog } from "./models/catalog.js";
import curriculumRoutes from "./routes/curriculum.js";


// Import configuration values
import { curriculumConfig, courseRegexMapping } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());
app.use("/api/curriculum", curriculumRoutes);

// =============================================================================
// Setup Multer Storage
// =============================================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// =============================================================================
// Generic DOCX Parsing Function
// =============================================================================
async function parseDOCXFile(filePath) {
  try {
    const { value } = await mammoth.extractRawText({ path: filePath });
    // Dynamically detect the curriculum type from config
    const configKey = Object.keys(curriculumConfig).find(key =>
      value.includes(curriculumConfig[key].header)
    );
    if (!configKey) throw new Error("Unknown curriculum type");

    const config = curriculumConfig[configKey];
    const startIndex = value.indexOf(config.header);
    const startIndexAdjusted = startIndex + config.offsetText.length;
    const endIndex = value.indexOf(config.footer, startIndex);
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Failed to find curriculum text");
    }

    const relevantText = value.substring(startIndexAdjusted, endIndex);
    const lines = relevantText.split("\n").filter(line => line.trim() !== "");

    const catalog = {
      curriculumType: config.curriculumType,
      FRESHMAN: { Fall: [], Spring: [] },
      SOPHOMORE: { Fall: [], Spring: [] },
      JUNIOR: { Fall: [], Spring: [] },
      SENIOR: { Fall: [], Spring: [] },
    };

    let currentYear = null;
    let currentSemester = null;

    for (const line of lines) {
      if (/FRESHMAN|SOPHOMORE|JUNIOR|SENIOR|GRADUATE/.test(line)) {
        currentYear = line.trim();
      } else if (/Fall|Spring/.test(line)) {
        currentSemester = line.trim();
      } else {
        const parts = line.split(/\t+/);
        if (parts.length >= 2) {
          const credits = parseInt(parts[0]);
          const course = parts.slice(1).join(" ").trim();
          if (!isNaN(credits) && course !== "") {
            catalog[currentYear][currentSemester].push({ credits, course });
          } else {
            console.warn(`Skipping invalid course entry: ${line}`);
          }
        } else {
          // Handle known specific cases if needed
          console.warn(`Skipping invalid line: ${line}`);
        }
      }
    }

    return catalog;
  } catch (error) {
    throw new Error("Error parsing DOCX file: " + error.message);
  }
}

// =============================================================================
// PHYS DOCX Parsing Function (similar idea)
// =============================================================================
async function parsePHYSDOCXFile(filePath, termFromBody, academicYear) {
  try {
    if (!academicYear) {
      const baseName = path.basename(filePath, path.extname(filePath));
      const match = baseName.match(/(\d{2})(FA|SP)/i);
      academicYear = match ? match[1] : new Date().getFullYear().toString().substr(2, 2);
    }
    const termSuffix = termFromBody?.toLowerCase() === "fall" ? "FA" : "SP";
    const TERM = `${academicYear}/${termSuffix}`;

    const { value } = await mammoth.extractRawText({ path: filePath });
    const lines = value.split("\n").map(line => line.trim()).filter(line => line !== "");

    if (lines.length % 4 !== 0) {
      console.warn("Unexpected number of lines in PHYS DOCX file.");
    }

    const applyDefaultAMPM = (time) => {
      const [hour, minute] = time.split(":").map(Number);
      return time + (hour < 12 ? "AM" : "PM");
    };

    const courses = [];
    for (let i = 0; i < lines.length; i += 4) {
      let courseCode = lines[i].replace(/\s+/g, '_');
      const section = lines[i + 1];
      const title = lines[i + 2];
      const meetingLine = lines[i + 3];

      const COURSE_NUMBER = `${courseCode}_${section}`;
      const [meetingDaysRaw, timeRange] = meetingLine.split(" ");
      const meetingDays = meetingDaysRaw.replace(/TTh/i, "T TH");
      const [startTimeRaw, endTimeRaw] = timeRange.split("-");
      const startTime = applyDefaultAMPM(startTimeRaw.trim());
      const endTime = applyDefaultAMPM(endTimeRaw.trim());

      courses.push({
        COURSE_NUMBER,
        TITLE_START_DATE: title,
        START_TIME: startTime,
        END_TIME: endTime,
        MEETING_DAYS: meetingDays,
        ROOM: "TBD",
        BUILDING: "TBD",
        TERM,
        ACADEMIC_LEVEL: "UG",
        ACADEMIC_LEVEL_1: "GR",
        CAPACITY: 0,
        INSTRUCTOR: "",
        MAX_CREDITS: 0,
        MIN_CREDITS: 0,
        NUMBER_OF_STUDENTS: 0,
        SCHOOLS: "",
        SECTION: section,
        SEQ_NO: i / 4 + 1,
        STATUS: "Open",
      });
    }

    return courses;
  } catch (error) {
    throw new Error("Error parsing PHYS DOCX file: " + error.message);
  }
}

// =============================================================================
// XLSX Parsing Function (remains similar)
// =============================================================================
async function parseXLSXFile(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    let jsonData = xlsx.utils.sheet_to_json(sheet);

    // Filter out courses where the STATUS column is "clsd" (case insensitive)
    jsonData = jsonData.filter(item => {
      return item["STATUS"] && item["STATUS"].toLowerCase() !== "cncl";
    });

    // Transform the remaining data
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
      ROOM: item["Room"],
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

// =============================================================================
// File Upload Endpoint
// =============================================================================
app.post("/api/upload", upload.single("file"), async (req, res) => {
  const termFromBody = req.body.term;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // === DOCX handling (unchanged) ===
    if (req.file.originalname.toLowerCase().endsWith(".docx")) {
      if (req.file.originalname.toLowerCase().includes("phys")) {
        const coursesData = await parsePHYSDOCXFile(req.file.path, termFromBody);
        await Promise.all(
          coursesData.map(course =>
            Course.findOneAndUpdate(
              { COURSE_NUMBER: course.COURSE_NUMBER, TERM: course.TERM },
              course,
              { upsert: true, new: true }
            )
          )
        );
      } else {
        const catalogData = await parseDOCXFile(req.file.path);
        await Catalog.deleteMany({ curriculumType: catalogData.curriculumType });
        await Catalog.create(catalogData);
      }
      fs.unlinkSync(req.file.path);
      return res.status(200).json({
        success: true,
        message: "DOCX file processed and saved successfully",
      });
    }

    // === XLSX handling (overwrite by suffix) ===
    if (req.file.originalname.toLowerCase().endsWith(".xlsx")) {
      const rawData = await parseXLSXFile(req.file.path);
    
      // ✅ Extract TERM from filename like "25SP" or "25FA"
      const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const match = baseName.match(/(\d{2})(FA|SP)/i);
      const yearPart = match ? match[1] : new Date().getFullYear().toString().slice(-2);
      const suffix = match ? match[2].toUpperCase() : "FA"; // default to FA
      const fullTERM = `${yearPart}/${suffix}`;
    
      console.log("📥 XLSX Upload Detected — TERM =", fullTERM);
    
      // Overwrite TERM for every course row
      const updatedData = rawData.map(course => ({
        ...course,
        TERM: fullTERM,
      }));
    
      // Remove existing courses with this TERM
      await Course.deleteMany({ TERM: fullTERM });
    
      // Save new ones
      await Promise.all(
        updatedData.map(course =>
          Course.findOneAndUpdate(
            { COURSE_NUMBER: course.COURSE_NUMBER, TERM: fullTERM },
            course,
            { upsert: true, new: true }
          )
        )
      );
    
      fs.unlinkSync(req.file.path);
      return res.status(200).json({
        success: true,
        message: `Courses uploaded for TERM ${fullTERM}`,
      });
    }
    

    // === unsupported file type ===
    return res.status(400).json({ success: false, message: "Unsupported file type" });
  } catch (error) {
    console.error("Error processing file:", error);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    return res.status(500).json({
      success: false,
      message: "An error occurred during upload",
      error: error.message,
    });
  }
});
// =============================================================================



app.post("/api/courses", async (req, res) => {
  try {
    const newCourse = req.body;
    const created = await Course.create(newCourse); // Mongoose create
    res.json({ success: true, message: "Course added", data: created });
  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({ success: false, message: "Failed to add course" });
  }
});

// =============================================================================
// GET Courses Endpoint with Dynamic Filtering
// =============================================================================
app.get("/api/courses", async (req, res) => {
  try {
    const { year, semester, course, room } = req.query;

    if (!year && !semester && !course && !room) {
      const allCourses = await Course.find();
      return res.json(allCourses);
    }

    const courseFilter = {};

    // TERM regex
    courseFilter.TERM = semester.toLowerCase() === "fall"
      ? { $regex: /\/FA$/ }
      : { $regex: /\/SP$/ };

    // ROOM optional
    if (room && room.trim() !== "") {
      courseFilter.ROOM = room;
    }

    // Build course number regex
    if (course && courseRegexMapping[course.toLowerCase()]) {
      const yearKey = year.toLowerCase();
      const semesterKey = semester.toLowerCase();
      const mapping = courseRegexMapping[course.toLowerCase()];

      if (!mapping[yearKey] || !mapping[yearKey][semesterKey]) {
        return res.status(400).json({ success: false, message: "Invalid year selected" });
      }

      const regex = mapping[yearKey][semesterKey];
      courseFilter.COURSE_NUMBER = { $regex: regex };

      console.log("📘 Regex being used:", regex);
    } else {
      return res.status(400).json({ success: false, message: "Invalid course type selected" });
    }

    const filteredCourses = await Course.find(courseFilter);

    // Debug CIS_277 specifically
    const debug277 = await Course.find({ COURSE_NUMBER: /CIS_277/i });
    console.log("\n🔎 DEBUG: All CIS_277 in DB:");
    debug277.forEach(course => {
      console.log(`- ${course.COURSE_NUMBER} | TERM=${course.TERM} | STATUS=${course.STATUS}`);
    });

    console.log("\n✅ Matched courses from query:");
    filteredCourses.forEach(c => console.log(`→ ${c.COURSE_NUMBER}`));

    return res.json(filteredCourses);
  } catch (error) {
    console.error("Error retrieving courses:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving courses",
    });
  }
});


// =============================================================================
// Other Endpoints (Catalog, GET by ID, PUT, DELETE)
// =============================================================================
app.get("/api/catalog/:curriculumType", async (req, res) => {
  try {
    const catalog = await Catalog.findOne({
      curriculumType: req.params.curriculumType,
    });
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

app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
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

app.put("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourse = req.body;
    const result = await Course.findByIdAndUpdate(id, updatedCourse, { new: true });
    if (!result) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    res.json({ success: true, message: "Course updated successfully", data: result });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the course",
    });
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    res.json({
      success: true,
      message: "Course deleted successfully",
      deletedCourse,
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the course",
    });
  }
});

// =============================================================================
// Start Server and Connect to MongoDB
// =============================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/coursesDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", error => console.error("MongoDB connection error:", error));
db.once("open", () => console.log("Connected to MongoDB"));
