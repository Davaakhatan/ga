let coursesData = [];
let currentEditingCourseId = null;
let uniqueRooms = new Set(); // Store unique room numbers

console.log("app.js loaded");

const fetchCourses = async () => {
  try {
    const selectedCourse = document.getElementById("course-catalog-dropdown").value;
    const selectedYear = document.getElementById("student-year-dropdown").value;
    const selectedSemester = document.getElementById("semester-dropdown").value;
    const selectedRoom = document.getElementById("room-dropdown").value; // Get selected room

    clearCalendar();
    uniqueRooms.clear();

    let url = `/api/courses?year=${selectedYear}&semester=${selectedSemester}&course=${selectedCourse}`;
    
    // Apply room filter only if a specific room is selected
    if (selectedRoom && selectedRoom !== "") {
      url += `&room=${selectedRoom}`;
    }

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



// Populate Room dropdown
const populateRoomDropdown = () => {
  const roomDropdown = document.getElementById("room-dropdown");
  const previousSelection = roomDropdown.value; // Store the current selected value

  roomDropdown.innerHTML = ""; // Clear existing options

  // Create "Select a Room" as default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Room";
  roomDropdown.appendChild(defaultOption);

  let foundSelectedRoom = false; // Track if the previous selection exists in the new list

  uniqueRooms.forEach((room) => {
    if (room) {
      const option = document.createElement("option");
      option.value = room;
      option.textContent = room;
      roomDropdown.appendChild(option);

      if (room === previousSelection) {
        foundSelectedRoom = true;
      }
    }
  });

  // Restore the selected value if it's still in the list
  if (foundSelectedRoom) {
    roomDropdown.value = previousSelection;
  } else {
    roomDropdown.value = ""; // Default to "Select a Room" if previous selection is no longer available
  }
};


// Clear calendar
const clearCalendar = () => {
  document.querySelectorAll("td.day-column").forEach((cell) => {
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
  return Math.ceil((endMinutes - startMinutes) / 60);
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
      ROOM,
      _id,
    } = course;

    // If any critical field is missing, log a warning and skip the course.
    if (!START_TIME || !END_TIME || !MEETING_DAYS) {
      console.warn(`Incomplete course data for ${COURSE_NUMBER}: ${JSON.stringify(course)}`);
      return;
    }

    // Add room to the unique set
    uniqueRooms.add(ROOM);

    // Parse meeting days and times
    const days = parseMeetingDays(MEETING_DAYS);
    const start = parseTime(START_TIME);
    const end = parseTime(END_TIME);
    
    // If time parsing fails, log a warning and skip the course.
    if (!start || !end) {
      console.warn(`Time parsing failed for course: ${COURSE_NUMBER}`);
      return;
    }
    
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    const rowSpan = calculateRowspan(startMinutes, endMinutes);
    const startHour = `${start.hour % 12 === 0 ? 12 : start.hour % 12}:00 ${start.hour >= 12 ? "PM" : "AM"}`;

    days.forEach((day) => {
      const cell = document.querySelector(`td[data-day="${day}"][data-time="${startHour}"]`);
      if (!cell) return;

      // Determine background color based on course subject
      let backgroundColor = "";
      if (COURSE_NUMBER.includes("MATH")) {
        backgroundColor = "#FFD700";
      } else if (COURSE_NUMBER.includes("PHYS")) {
        backgroundColor = "#ADD8E6";
      }

      const courseHTML = `
        <div class="course-box" style="background-color: ${backgroundColor}; padding: 5px; border-radius: 5px;">
          <strong>${COURSE_NUMBER}</strong><br />
          ${TITLE_START_DATE}<br />
          ${START_TIME} - ${END_TIME}<br />
          Room: ${ROOM || "N/A"}<br />
          <span class="icon-buttons">
            <i class="material-icons edit-icon" onclick="editCourse('${_id}')">edit</i>
            <i class="material-icons delete-icon" onclick="deleteCourse('${_id}')">delete</i>
          </span>
        </div>
      `;

      // If the cell already has content, display a conflict container.
      if (cell.innerHTML.trim() !== "") {
        cell.innerHTML = `
          <div class="conflict-container" style="display: flex; gap: 5px; background-color: #FFB6C1; padding: 5px; border-radius: 5px;">
            ${cell.innerHTML} | ${courseHTML}
          </div>
        `;
      } else {
        cell.innerHTML = courseHTML;
        cell.rowSpan = rowSpan;

        // Hide cells in subsequent rows that are covered by this course's row span.
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


const editCourse = (courseId) => {
  const course = coursesData.find((c) => c._id === courseId);
  if (!course) {
    alert("Course not found.");
    return;
  }

  currentEditingCourseId = courseId;

  document.getElementById("courseNumber").value = course.COURSE_NUMBER;
  document.getElementById("courseTitle").value = course.TITLE_START_DATE;
  document.getElementById("startTime").value = course.START_TIME;
  document.getElementById("endTime").value = course.END_TIME;
  document.getElementById("roomInput").value = course.ROOM || ""; // Ensure Room field is an input

  const modalElement = document.getElementById("editCourseModal");
  if (!modalElement) {
    console.error("Modal element not found in the DOM!");
    return;
  }

  const modal = new bootstrap.Modal(modalElement);
  modal.show();

  // Attach the save function to the save button
  document.getElementById("saveCourseChanges").onclick = saveEditedCourse;
};

const saveEditedCourse = async () => {
  if (!currentEditingCourseId) {
    alert("No course selected for editing.");
    return;
  }

  // Gather updated course details
  const updatedCourse = {
    COURSE_NUMBER: document.getElementById("courseNumber").value,
    TITLE_START_DATE: document.getElementById("courseTitle").value,
    START_TIME: document.getElementById("startTime").value,
    END_TIME: document.getElementById("endTime").value,
    ROOM: document.getElementById("roomInput").value,
  };

  try {
    const response = await fetch(`/api/courses/${currentEditingCourseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCourse),
    });

    const result = await response.json();
    if (result.success) {
      alert("Course updated successfully!");
      fetchCourses(); // Refresh the calendar
      document.getElementById("editCourseModal").querySelector(".btn-close").click(); // Close modal
    } else {
      alert("Failed to update the course.");
    }
  } catch (error) {
    console.error("Error updating course:", error);
    alert("An error occurred while updating the course.");
  }
};


// Fix Delete Course
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

// Load courses on startup
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("course-catalog-dropdown").addEventListener("change", fetchCourses);
  document.getElementById("student-year-dropdown").addEventListener("change", fetchCourses);
  document.getElementById("semester-dropdown").addEventListener("change", fetchCourses);
  document.getElementById("room-dropdown").addEventListener("change", fetchCourses);

  fetchCourses();
});
