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

// Import your Mongoose models for the data you want to store
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

// =============================================================================
// DOCX Parsing Function for CS, Cybersecurity, Software Engineering
// =============================================================================
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
      startIndexAdjusted =
        startIndex +
        "Computer Science Curriculum\n(Numerals in front of courses indicate credits)\n"
          .length;
      endIndex = value.indexOf("Total Credits: 129", startIndex);
    } else if (value.includes("Cybersecurity Curriculum")) {
      curriculumType = "Cybersecurity";
      startIndex = value.indexOf("Cybersecurity Curriculum");
      startIndexAdjusted =
        startIndex +
        "Cybersecurity Curriculum\n(Numerals in front of courses indicate credits)\n"
          .length;
      endIndex = value.indexOf("Total Credits: 126", startIndex);
    } else if (value.includes("Software Engineering Curriculum")) {
      curriculumType = "Software Engineering";
      startIndex = value.indexOf("Software Engineering Curriculum");
      startIndexAdjusted =
        startIndex +
        "Software Engineering Curriculum\n(Numerals in front of courses indicate credits)\n"
          .length;
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
      SENIOR: { Fall: [], Spring: [] },
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
            console.warn(`Skipping invalid course entry: ${line}`);
          }
        } else {
          // Specific cases for known courses
          if (line.includes("Intro to Engineering/ENG 102")) {
            catalog["FRESHMAN"]["Fall"].push({
              credits: 1,
              course: "Intro to Engineering/ENG 102",
            });
          } else if (line.includes("Problem Solv. and Computer Prog./ CIS 180")) {
            catalog["FRESHMAN"]["Fall"].push({
              credits: 2,
              course: "Problem Solv. and Computer Prog./ CIS 180",
            });
          } else {
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

// =============================================================================
// New PHYS DOCX Parsing Function
// =============================================================================

async function parsePHYSDOCXFile(filePath, termFromBody, academicYear) {
  try {
    if (!academicYear) {
      const baseName = path.basename(filePath, path.extname(filePath)); // e.g. "24FA_PHYS" or "PHYS"
      const match = baseName.match(/(\d{2})(FA|SP)/i);
      if (match) {
        academicYear = match[1]; // e.g., "24"
      } else {
        academicYear = new Date().getFullYear().toString().substr(2, 2); // Fallback to current year
      }
    }

    const termSuffix = termFromBody && termFromBody.toLowerCase() === "fall" ? "FA" : "SP";
    const TERM = `${academicYear}/${termSuffix}`;

    const { value } = await mammoth.extractRawText({ path: filePath });
    const lines = value
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "");

    if (lines.length % 4 !== 0) {
      console.warn("Unexpected number of lines in PHYS DOCX file. Some courses may be incomplete.");
    }

    const applyDefaultAMPM = (time, isStart = true) => {
      const [hour, minute] = time.split(":").map(Number);
      if (hour < 8) {
        return time + "AM"; // Early morning class
      } else if (hour < 12) {
        return time + "AM"; // Regular morning class
      } else {
        return time + "PM"; // Afternoon or evening class
      }
    };

    const courses = [];
    for (let i = 0; i < lines.length; i += 4) {
      let courseCode = lines[i];         // e.g., "PHYS 101"
      const section = lines[i + 1];        // e.g., "01"
      const title = lines[i + 2];          // e.g., "Concepts in Physics"
      const meetingLine = lines[i + 3];    // e.g., "TTh 9:30-10:50"

      // Normalize course code (PHYS 101 -> PHYS_101)
      courseCode = courseCode.replace(/\s+/g, '_');
      const COURSE_NUMBER = `${courseCode}_${section}`;

      // Parse meeting details
      const meetingParts = meetingLine.split(" ");
      const meetingDaysRaw = meetingParts[0] || "";
      const meetingDays = meetingDaysRaw.replace(/TTh/i, "T TH");  // Normalize "TTh"

      const timeRange = meetingParts[1] || "";
      const timeParts = timeRange.split("-");
      let startTime = timeParts[0] ? timeParts[0].trim() : "";
      let endTime = timeParts[1] ? timeParts[1].trim() : "";

      // Automatically append smart AM/PM
      startTime = applyDefaultAMPM(startTime, true);
      endTime = applyDefaultAMPM(endTime, false);

      courses.push({
        COURSE_NUMBER,
        TITLE_START_DATE: title,
        START_TIME: startTime,
        END_TIME: endTime,
        MEETING_DAYS: meetingDays,
        ROOM: "TBD",          // Placeholder to avoid empty issues in display
        BUILDING: "TBD",      // Placeholder to avoid empty issues in display
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
        STATUS: "Open"
      });
    }

    console.log("✅ Final Parsed PHYS DOCX courses:", JSON.stringify(courses, null, 2));
    return courses;
  } catch (error) {
    throw new Error("Error parsing PHYS DOCX file: " + error.message);
  }
}



// =============================================================================
// XLSX Parsing Function
// =============================================================================
async function parseXLSXFile(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
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
  const termFromBody = req.body.term; // e.g., "fall" or "spring"
  // Notice: we are no longer explicitly passing academicYear if it isn’t provided.
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    if (req.file.originalname.toLowerCase().endsWith(".docx")) {
      if (req.file.originalname.toLowerCase().includes("phys")) {
        // academicYear parameter is omitted; the parser will handle it.
        const coursesData = await parsePHYSDOCXFile(req.file.path, termFromBody);
        await Promise.all(
          coursesData.map((course) =>
            Course.findOneAndUpdate(
              { COURSE_NUMBER: course.COURSE_NUMBER, TERM: course.TERM },
              course,
              { upsert: true, new: true }
            )
          )
        );
        fs.unlinkSync(req.file.path);
        return res.status(200).json({
          success: true,
          message: "PHYS DOCX file processed and saved successfully",
        });
      } else {
        // Existing logic for other DOCX files
        const catalogData = await parseDOCXFile(req.file.path);
        await Catalog.deleteMany({ curriculumType: catalogData.curriculumType });
        await Catalog.create(catalogData);
        fs.unlinkSync(req.file.path);
        return res.status(200).json({
          success: true,
          message: "DOCX file processed and saved successfully",
        });
      }
    }
    // XLSX branch remains unchanged.
    else if (req.file.originalname.toLowerCase().endsWith(".xlsx")) {
      const transformedData = await parseXLSXFile(req.file.path);
      const termSuffix = termFromBody.toLowerCase() === "fall" ? "FA" : "SP";
      const updatedData = transformedData.map((course) => {
        if (course.TERM) {
          if (course.TERM.includes("/")) {
            const parts = course.TERM.split("/");
            return { ...course, TERM: `${parts[0]}/${termSuffix}` };
          } else {
            return { ...course, TERM: `${course.TERM}/${termSuffix}` };
          }
        } else {
          return { ...course, TERM: termSuffix };
        }
      });
      await Promise.all(
        updatedData.map((course) =>
          Course.findOneAndUpdate(
            { COURSE_NUMBER: course.COURSE_NUMBER, TERM: course.TERM },
            course,
            { upsert: true, new: true }
          )
        )
      );
      fs.unlinkSync(req.file.path);
      return res.status(200).json({
        success: true,
        message: "XLSX file processed and saved successfully",
      });
    } else {
      return res.status(400).json({ success: false, message: "Unsupported file type" });
    }
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during upload",
      error: error.message,
    });
  }
});



// =============================================================================
// GET Endpoints (unchanged)
// =============================================================================
app.get("/api/courses", async (req, res) => {
  try {
    const { year, semester, course, room } = req.query;

  // If no filters are provided, return ALL courses (for "Export All")
  if (!year && !semester && !course && !room) {
    const allCourses = await Course.find();
    return res.json(allCourses);
  }

    let courseFilter = {};
    courseFilter.TERM = semester === "fall" ? { $regex: /\/FA$/ } : { $regex: /\/SP$/ };

    if (room && room.trim() !== "") {
      courseFilter.ROOM = room;
    }

    if (course === "computer-science") {
      switch (year) {
        case "freshman":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CIS_180|CIS_181|CIS_290|MATH_140)/i }
              : { $regex: /^(CIS_182|CIS_183|MATH_141|PHYS_210(_\d+)?|PHYS_211(_\d+)?)/i };
          break;
        case "sophomore":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CSC_220|CIS_239|CIS_277|CIS_287|MATH_222)/i }
              : { $regex: /^(CIS_255|CSC_223|SOFT_210|MATH_223|MATH_314|PHYS_214(_\d+)?|PHYS_212(_\d+)?|PHYS_213(_\d+)?|PHYS_215(_\d+)?)/i };
          break;
        case "junior":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CIS_355|CIS_326|CIS_219|MATH_213|MATH_212)/i }
              : { $regex: /^(MATH_310)/i };
          break;
        case "senior":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CIS_457|CSC_360|CIS_387|CSC_330)/i }
              : { $regex: /^(CIS_458|CIS_390)/i };
          break;
        case "graduate":
          courseFilter.COURSE_NUMBER = { $regex: /^$/ };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid year selected",
          });
      }
    } else if (course === "cybersecurity") {
      switch (year) {
        case "freshman":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CIS_180|CIS_181|CIS_290|CIS_240|MATH_112|MATH_140)/i }
              : { $regex: /^(CIS_182|CIS_183|CIS_255|PHYS_105|CYSEC_101)/i };
          break;
        case "sophomore":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(MATH_222|CSC_220|CIS_355|CYSEC_210)/i }
              : { $regex: /^(CIS_182|CIS_183|CIS_255|PHYS_105|CYSEC_101)/i };
          break;
        case "junior":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CYSEC_301|CYSEC_306|CRJS_241|MATH_213)/i }
              : { $regex: /^(MATH_310|CYSEC_302|CYSEC_307)/i };
          break;
        case "senior":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CYSEC_308|CIS_457|CRJS_345)/i }
              : { $regex: /^(CYSEC_303|CIS_458)/i };
          break;
        case "graduate":
          courseFilter.COURSE_NUMBER = { $regex: /^$/ };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid year selected",
          });
      }
    } else if (course === "software-engineering") {
      // New branch for software engineering courses.
      // Adjust the regex patterns based on your actual software-engineering course numbering.
      switch (year) {
        case "freshman":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CIS_181|CIS_181|MATH_140|CIS_290)/i }
              : { $regex: /^(CIS_182|CIS_183|MATH_141)/i };
          break;
        case "sophomore":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CSC_220|CIS_239|MATH_213|MATH_312|CIS_277|CIS_287)/i }
              : { $regex: /^(CIS_255|CSC_223|MATH_223|CIS_377|MATH_314)/i };
          break;
        case "junior":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CIS_326|CIS_350|CIS_219|SOFT_310)/i }
              : { $regex: /^(SOFT_320|ECE_337|ENG_380)/i };
          break;
        case "senior":
          courseFilter.COURSE_NUMBER =
            semester === "fall"
              ? { $regex: /^(CIS_457|CSC_330|SOFT_410|CIS_387)/i }
              : { $regex: /^(CIS_458|CIS_390|MATH_310)/i };
          break;
        case "graduate":
          courseFilter.COURSE_NUMBER = { $regex: /^$/ };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid year selected",
          });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid course type selected",
      });
    }

    console.log("Generated course filter:", JSON.stringify(courseFilter, null, 2));
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


app.get("/api/catalog/:curriculumType", async (req, res) => {
  try {
    const catalog = await Catalog.findOne({
      curriculumType: req.params.curriculumType,
    });
    if (!catalog) {
      return res
        .status(404)
        .json({ success: false, message: "Catalog not found" });
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

// =============================================================================
// PUT Endpoint (unchanged if not using duplicate check for updates)
// =============================================================================
app.put("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourse = req.body;
    const result = await Course.findByIdAndUpdate(id, updatedCourse, {
      new: true,
    });
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.json({
      success: true,
      message: "Course updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the course",
    });
  }
});

// =============================================================================
// DELETE Endpoint
// =============================================================================
app.delete("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
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

mongoose.connect("mongodb://localhost:27017/coursesDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.error("MongoDB connection error:", error));
db.once("open", () => console.log("Connected to MongoDB"));
