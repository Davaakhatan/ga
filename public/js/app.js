// app.js

let coursesData = [];
let currentEditingCourseId = null;
let uniqueRooms = new Set(); // Store unique room numbers

console.log("app.js loaded");

// -------------------------
// Helper Functions
// -------------------------

// Returns default values if any critical course field is missing.
const getCourseDefaults = (course) => {
  return {
    START_TIME: course.START_TIME || "08:00 AM",
    END_TIME: course.END_TIME || "09:00 AM",
    MEETING_DAYS: course.MEETING_DAYS || "M" // Default to Monday if missing
  };
};

const getDOMElement = (id) => document.getElementById(id);

// Parses a time string (hh:mm AM/PM) to an object with hour and minute.
const parseTime = (time) => {
  const match = time.match(/^([0-9]{1,2}):([0-9]{2})\s?(AM|PM)$/i);
  if (!match) return null;
  let [, hour, minute, period] = match;
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10);
  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
  return { hour, minute };
};

// Converts a time string into minutes since midnight.
const parseTimeToMinutes = (time) => {
  const t = parseTime(time);
  return t ? t.hour * 60 + t.minute : null;
};

const validateTimeRange = (startTime, endTime) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) {
    alert("Invalid time format. Please use hh:mm AM/PM format.");
    return false;
  }
  return startMinutes < endMinutes;
};

const calculateRowspan = (startMinutes, endMinutes) => {
  return Math.ceil((endMinutes - startMinutes) / 60);
};

// Parses meeting days from a string into an array of full day names.
const parseMeetingDays = (daysStr) => {
  const validDays = { M: "Monday", T: "Tuesday", W: "Wednesday", TH: "Thursday", F: "Friday" };
  const dayRegex = /\b(M|T|W|TH|F)\b/g;
  return (daysStr.match(dayRegex) || []).map(day => validDays[day]);
};

// Returns a formatted time for cell lookup (e.g., "8:00 AM").
const formatHourForCell = (hour24) => {
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const period = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:00 ${period}`;
};

// Builds the course HTML box.
const buildCourseHTML = (course, displayStart, displayEnd, backgroundColor) => {
  return `
    <div class="course-box" style="background-color: ${backgroundColor}; padding: 5px; border-radius: 5px;">
      <strong>${course.COURSE_NUMBER}</strong><br />
      ${course.TITLE_START_DATE}<br />
      ${displayStart} - ${displayEnd}<br />
      <strong>Building:</strong> ${course.BUILDING || "N/A"}<br />
      <strong>Room:</strong> ${course.ROOM || "N/A"}<br />
      <span class="icon-buttons">
        <i class="material-icons edit-icon" onclick="editCourse('${course._id}')">edit</i>
        <i class="material-icons delete-icon" onclick="deleteCourse('${course._id}')">delete</i>
      </span>
    </div>
  `;
};

// -------------------------
// DOM Update Functions
// -------------------------

// Clears the calendar grid.
const clearCalendar = () => {
  document.querySelectorAll("td.day-column").forEach(cell => {
    cell.innerHTML = "";
    cell.style.display = "";
    cell.rowSpan = 1;
  });
};

// Populates the room dropdown based on uniqueRooms set.
const populateRoomDropdown = () => {
  const roomDropdown = getDOMElement("room-dropdown");
  const previousSelection = roomDropdown.value;
  roomDropdown.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Room";
  roomDropdown.appendChild(defaultOption);

  let foundSelectedRoom = false;
  uniqueRooms.forEach(room => {
    if (room) {
      const option = document.createElement("option");
      option.value = room;
      option.textContent = room;
      roomDropdown.appendChild(option);
      if (room === previousSelection) foundSelectedRoom = true;
    }
  });
  roomDropdown.value = foundSelectedRoom ? previousSelection : "";
};

// -------------------------
// Main Functions
// -------------------------

const fetchCourses = async () => {
  try {
    const selectedCourse = getDOMElement("course-catalog-dropdown").value;
    const selectedYear = getDOMElement("student-year-dropdown").value;
    const selectedSemester = getDOMElement("semester-dropdown").value;
    const selectedRoom = getDOMElement("room-dropdown").value;

    clearCalendar();
    uniqueRooms.clear();

    let url = `/api/courses?year=${selectedYear}&semester=${selectedSemester}&course=${selectedCourse}`;
    if (selectedRoom && selectedRoom !== "") url += `&room=${selectedRoom}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch from ${url}`);

    const data = await response.json();
    coursesData = data;

    if (data.length === 0) {
      console.log("No courses found for this selection.");
    } else {
      displayCourses(data);
      populateRoomDropdown();
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const displayCourses = (courses) => {
  courses.forEach(course => {
    // Use defaults if fields are missing.
    const { START_TIME, END_TIME, MEETING_DAYS } = getCourseDefaults(course);
    const displayStart = START_TIME;
    const displayEnd = END_TIME;
    const displayMeeting = MEETING_DAYS;

    // Log warning if we had to use defaults.
    if (!course.START_TIME || !course.END_TIME || !course.MEETING_DAYS) {
      console.warn(`Incomplete course data for ${course.COURSE_NUMBER}. Using defaults: START_TIME="${displayStart}", END_TIME="${displayEnd}", MEETING_DAYS="${displayMeeting}"`);
    }

    // Add room to unique set.
    uniqueRooms.add(course.ROOM);

    // Parse meeting days and times.
    const days = parseMeetingDays(displayMeeting);
    const startParsed = parseTime(displayStart);
    const endParsed = parseTime(displayEnd);

    if (!startParsed || !endParsed) {
      console.warn(`Time parsing failed for course: ${course.COURSE_NUMBER}`);
      return;
    }

    const startMinutes = startParsed.hour * 60 + startParsed.minute;
    const endMinutes = endParsed.hour * 60 + endParsed.minute;
    const rowSpan = calculateRowspan(startMinutes, endMinutes);
    const cellTime = formatHourForCell(startParsed.hour);

    // Determine background color based on subject.
    let backgroundColor = "";
    if (course.COURSE_NUMBER.includes("MATH")) backgroundColor = "#FFD700";
    else if (course.COURSE_NUMBER.includes("PHYS")) backgroundColor = "#ADD8E6";

    const courseHTML = buildCourseHTML(course, displayStart, displayEnd, backgroundColor);

    // Render the course in each meeting day cell.
    days.forEach(day => {
      const cell = document.querySelector(`td[data-day="${day}"][data-time="${cellTime}"]`);
      if (!cell) return;

      if (cell.innerHTML.trim() !== "") {
        // If the cell already has content, wrap it in a conflict container.
        cell.innerHTML = `
          <div class="conflict-container" style="display: flex; gap: 5px; background-color: #FFB6C1; padding: 5px; border-radius: 5px;">
            ${cell.innerHTML} | ${courseHTML}
          </div>
        `;
      } else {
        cell.innerHTML = courseHTML;
        cell.rowSpan = rowSpan;

        // Hide cells in subsequent rows that fall under the same course's row span.
        let nextRow = cell.parentElement.nextElementSibling;
        for (let i = 1; i < rowSpan; i++) {
          const extraCell = nextRow?.querySelector(`td[data-day="${day}"]`);
          if (extraCell) extraCell.style.display = "none";
          nextRow = nextRow?.nextElementSibling;
        }
      }
    });
  });
};

// -------------------------
// Edit, Save, Delete, Export Functions
// -------------------------

const editCourse = (courseId) => {
  const course = coursesData.find(c => c._id === courseId);
  if (!course) {
    alert("Course not found.");
    return;
  }
  currentEditingCourseId = courseId;
  getDOMElement("courseNumber").value = course.COURSE_NUMBER;
  getDOMElement("courseTitle").value = course.TITLE_START_DATE;
  getDOMElement("startTime").value = course.START_TIME;
  getDOMElement("endTime").value = course.END_TIME;
  getDOMElement("roomInput").value = course.ROOM || "";
  getDOMElement("meetingDays").value = course.MEETING_DAYS || "";
  getDOMElement("buildingInput").value = course.BUILDING || "";

  const modalElement = getDOMElement("editCourseModal");
  if (!modalElement) {
    console.error("Modal element not found in the DOM!");
    return;
  }
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
  getDOMElement("saveCourseChanges").onclick = saveEditedCourse;
};

const saveEditedCourse = async () => {
  if (!currentEditingCourseId) {
    alert("No course selected for editing.");
    return;
  }
  const startTime = getDOMElement("startTime").value.trim();
  const endTime = getDOMElement("endTime").value.trim();

  if (!validateTimeRange(startTime, endTime)) {
    alert("Start time must be before end time!");
    return;
  }

  const updatedCourse = {
    COURSE_NUMBER: getDOMElement("courseNumber").value,
    TITLE_START_DATE: getDOMElement("courseTitle").value,
    START_TIME: startTime,
    END_TIME: endTime,
    ROOM: getDOMElement("roomInput").value,
    BUILDING: getDOMElement("buildingInput").value,
    MEETING_DAYS: getDOMElement("meetingDays").value,
  };

  try {
    const response = await fetch(`/api/courses/${currentEditingCourseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCourse)
    });
    const result = await response.json();
    if (result.success) {
      alert("Course updated successfully!");
      fetchCourses();
      getDOMElement("editCourseModal").querySelector(".btn-close").click();
    } else {
      alert("Failed to update the course.");
    }
  } catch (error) {
    console.error("Error updating course:", error);
    alert("An error occurred while updating the course.");
  }
};

const deleteCourse = async (courseId) => {
  if (!confirm("Are you sure you want to delete this course?")) return;
  try {
    const response = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    const result = await response.json();
    if (result.success) {
      alert(result.message);
      fetchCourses();
    } else {
      alert("Failed to delete the course: " + result.message);
    }
  } catch (error) {
    console.error("Error deleting course:", error);
  }
};

const exportCourses = async (mode = "displayed") => {
  let dataToExport = [];
  if (mode === "all") {
    const response = await fetch("/api/courses");
    if (!response.ok) {
      alert("Failed to fetch all courses");
      return;
    }
    dataToExport = await response.json();
  } else {
    dataToExport = coursesData;
  }
  if (dataToExport.length === 0) {
    alert("No courses available to export.");
    return;
  }
  const worksheetData = [
    ["COURSE NUMBER", "TITLE", "START TIME", "END TIME", "MEETING DAYS", "BUILDING", "ROOM", "INSTRUCTOR", "TERM", "STATUS"]
  ];
  dataToExport.forEach(course => {
    worksheetData.push([
      course.COURSE_NUMBER,
      course.TITLE_START_DATE,
      course.START_TIME,
      course.END_TIME,
      course.MEETING_DAYS,
      course.BUILDING || "N/A",
      course.ROOM || "N/A",
      course.INSTRUCTOR || "Unknown",
      course.TERM || "Unknown",
      course.STATUS || "Open"
    ]);
  });
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Courses");
  const fileName = mode === "all" ? "All_Courses" : "Filtered_Courses";
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const openAddCourseModal = () => {
  const modal = new bootstrap.Modal(getDOMElement("addCourseModal"));
  modal.show();
};

const saveNewCourse = async () => {
  const COURSE_NUMBER = getDOMElement("newCourseNumber").value.trim();
  const TITLE_START_DATE = getDOMElement("newCourseTitle").value.trim();
  const MEETING_DAYS = getDOMElement("newMeetingDays").value.trim();
  const START_TIME = getDOMElement("newStartTime").value.trim();
  const END_TIME = getDOMElement("newEndTime").value.trim();
  const BUILDING = getDOMElement("newBuilding").value.trim();
  const ROOM = getDOMElement("newRoom").value.trim();

  if (!COURSE_NUMBER || !TITLE_START_DATE || !MEETING_DAYS || !START_TIME || !END_TIME) {
    alert("Please fill in all required fields.");
    return;
  }

  const selectedTerm = getDOMElement("semester-dropdown").value;
  const termSuffix = selectedTerm === "fall" ? "FA" : "SP";
  const year = new Date().getFullYear().toString().slice(-2);
  const TERM = `${year}/${termSuffix}`;

  const newCourse = {
    COURSE_NUMBER,
    TITLE_START_DATE,
    MEETING_DAYS,
    START_TIME,
    END_TIME,
    BUILDING,
    ROOM,
    TERM,
    STATUS: "Open"
  };

  try {
    const response = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCourse)
    });
    const result = await response.json();
    if (result.success) {
      alert("Course added successfully!");
      fetchCourses();
      getDOMElement("addCourseModal").querySelector(".btn-close").click();
    } else {
      alert("Failed to add course.");
    }
  } catch (error) {
    console.error("Error adding course:", error);
    alert("An error occurred while adding the course.");
  }
};

// -------------------------
// Event Listeners
// -------------------------
window.addEventListener("DOMContentLoaded", () => {
  ["course-catalog-dropdown", "student-year-dropdown", "semester-dropdown", "room-dropdown"].forEach(id => {
    getDOMElement(id).addEventListener("change", fetchCourses);
  });
  fetchCourses();
});
