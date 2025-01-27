let coursesData = [];
let currentEditingCourseId = null;

console.log("app.js loaded");

// Fetch courses
const fetchCourses = async () => {
  try {
    const selectedCourse = document.getElementById("course-catalog-dropdown").value;
    const selectedYear = document.getElementById("student-year-dropdown").value;
    const selectedSemester = document.getElementById("semester-dropdown").value;

    clearCalendar();

    const url = `/api/courses?year=${selectedYear}&semester=${selectedSemester}&course=${selectedCourse}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}`);
    }

    const data = await response.json();
    coursesData = data;

    if (data.length === 0) {
      console.log("No courses found for this selection.");
    } else {
      displayCourses(data);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// Clear calendar
const clearCalendar = () => {
  const cells = document.querySelectorAll("td.day-column");
  cells.forEach((cell) => {
    cell.innerHTML = "";
    cell.style.display = "";
    cell.rowSpan = 1;
  });
};

// Parse time
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

// Calculate row span
const calculateRowspan = (startMinutes, endMinutes) => {
  return Math.ceil((endMinutes - startMinutes) / 60); // Each row represents 1 hour
};

// Parse meeting days
const parseMeetingDays = (days) => {
  const validDays = { M: "Monday", T: "Tuesday", W: "Wednesday", TH: "Thursday", F: "Friday" };
  const dayRegex = /\b(M|T|W|TH|F)\b/g;
  return (days.match(dayRegex) || []).map((day) => validDays[day]);
};

// Display courses
const displayCourses = (courses) => {
  courses.forEach((course) => {
    const {
      COURSE_NUMBER,
      TITLE_START_DATE,
      START_TIME,
      END_TIME,
      MEETING_DAYS,
      BUILDING,
      ROOM,
      _id,
    } = course;

    if (!START_TIME || !END_TIME || !MEETING_DAYS) {
      console.warn(`Invalid course data: ${JSON.stringify(course)}`);
      return;
    }

    const days = parseMeetingDays(MEETING_DAYS);
    const start = parseTime(START_TIME);
    const end = parseTime(END_TIME);
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    const rowSpan = calculateRowspan(startMinutes, endMinutes);
    const startHour = `${start.hour % 12 === 0 ? 12 : start.hour % 12}:00 ${
      start.hour >= 12 ? "PM" : "AM"
    }`;

    days.forEach((day) => {
      const cell = document.querySelector(`td[data-day="${day}"][data-time="${startHour}"]`);

      if (!cell) {
        console.warn(`No cell found for ${day} at ${startHour}`);
        return;
      }

      // Determine course color based on type
      let backgroundColor = "";
      if (COURSE_NUMBER.includes("MATH")) {
        backgroundColor = "#FFD700"; // Yellow for MATH
      } else if (COURSE_NUMBER.includes("PHYS")) {
        backgroundColor = "#ADD8E6"; // Light blue for PHYS
      }

      // Generate the HTML for the course
      const courseHTML = `
        <div class="course-box" style="background-color: ${backgroundColor}; padding: 5px; margin: 2px; border-radius: 5px;">
          <strong>${COURSE_NUMBER}</strong><br />
          ${TITLE_START_DATE}<br />
          ${START_TIME} - ${END_TIME}<br />
          ${BUILDING || "N/A"} ${ROOM || "N/A"}<br />
          <span class="icon-buttons">
            <i class="material-icons edit-icon" onclick="editCourse('${_id}')">edit</i>
            <i class="material-icons delete-icon" onclick="deleteCourse('${_id}')">delete</i>
          </span>
        </div>
      `;

      if (cell.innerHTML.trim() !== "") {
        // If there's already content, add the new course as a conflict
        const existingContent = cell.innerHTML;
        cell.innerHTML = `
          <div class="conflict-container" style="display: flex; gap: 5px;">
            ${existingContent}
            <div style="background-color: #FFB6C1; padding: 5px; margin: 2px; border-radius: 5px;">
              <strong>${COURSE_NUMBER}</strong><br />
              ${TITLE_START_DATE}<br />
              ${START_TIME} - ${END_TIME}<br />
              ${BUILDING || "N/A"} ${ROOM || "N/A"}<br />
              <span class="icon-buttons">
                <i class="material-icons edit-icon" onclick="editCourse('${_id}')">edit</i>
                <i class="material-icons delete-icon" onclick="deleteCourse('${_id}')">delete</i>
              </span>
            </div>
          </div>
        `;
      } else {
        // No conflict, place the course normally
        cell.innerHTML = courseHTML;
        cell.rowSpan = rowSpan;

        // Hide cells beneath the spanned rows
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


// Event listeners
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("course-catalog-dropdown").addEventListener("change", fetchCourses);
  document.getElementById("student-year-dropdown").addEventListener("change", fetchCourses);
  document.getElementById("semester-dropdown").addEventListener("change", fetchCourses);

  fetchCourses();
});
