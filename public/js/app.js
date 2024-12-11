let coursesData = []; // Declare this variable globally to store fetched courses
let currentEditingCourseId = null; // Store the course ID being edited

console.log("app.js loaded");

// Fetch courses based on selected filters
const fetchCourses = async () => {
  try {
    const selectedCourse = document.getElementById(
      "course-catalog-dropdown"
    ).value;
    const selectedYear = document.getElementById("student-year-dropdown").value;
    const selectedSemester = document.getElementById(
      "student-semester-dropdown"
    ).value;
    const courseCatalog = document.getElementById("course-catalog");

    // Clear previous courses
    courseCatalog.innerHTML = "";
    clearCalendar();

    let url = `/api/courses?year=${selectedYear}&semester=${selectedSemester}&course=${selectedCourse}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}`);
    }

    const data = await response.json();
    coursesData = data; // Store fetched data globally

    if (data.length === 0) {
      courseCatalog.innerHTML = "No courses found for this selection.";
    } else {
      displayCourses(data);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById("course-catalog").innerHTML =
      '<div class="alert alert-danger">Error fetching courses. Please try again later.</div>';
  }
};

// Function to clear the calendar cells
const clearCalendar = () => {
  const cells = document.querySelectorAll("td[data-day][data-time]");
  cells.forEach((cell) => {
    cell.innerHTML = "";
  });
};

const clearExtraRows = () => {
  const rows = document.querySelectorAll(".calendar-table tbody tr");
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const allCellsEmpty = cells.every(
      (cell) => cell.innerHTML.trim() === "" || cell.style.display === "none"
    );

    if (allCellsEmpty) {
      row.style.display = "none"; // Hide the row completely
    }
  });
};

// const displayCourses = (data) => {
//   console.clear();
//   console.log("Loaded courses:", data);

//   const conflictColor = "#ffcccc"; // Highlight conflicts
//   const defaultColor = "#ffffff"; // Default cell color
//   const validDays = ["M", "T", "W", "TH", "F"]; // Valid days for the calendar

//   const parseTime = (time) => {
//     const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
//     if (!match) {
//       console.error(`Invalid time format: "${time}"`);
//       return null;
//     }
//     let [, hour, minute, period] = match;
//     hour = parseInt(hour, 10);
//     minute = parseInt(minute, 10);

//     if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
//     if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

//     return { hour, minute };
//   };

//   const timeToMinutes = (time) => {
//     const parsedTime = parseTime(time);
//     return parsedTime ? parsedTime.hour * 60 + parsedTime.minute : NaN;
//   };

//   const roundTimeToSlot = (time) => {
//     const parsedTime = parseTime(time);
//     if (!parsedTime) return null;

//     let { hour, minute } = parsedTime;
//     minute = minute >= 30 ? 30 : 0; // Round to the nearest 30 minutes
//     return `${hour % 12 || 12}:${minute.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
//   };

//   const calculateRowspan = (startMinutes, endMinutes) => {
//     return Math.ceil((endMinutes - startMinutes) / 30); // Each row = 30 minutes
//   };

//   const parseMeetingDays = (days) => {
//     const regex = /\bTH\b|[MTWF]/g;
//     const matchedDays = days.match(regex) || [];

//     return matchedDays.map((day) => {
//       switch (day) {
//         case "M":
//         case "T":
//         case "W":
//         case "TH":
//         case "F":
//           return day;
//         default:
//           console.warn(`Unexpected day code: "${day}"`);
//           return null;
//       }
//     }).filter(Boolean);
//   };

//   const clearCalendar = () => {
//     const cells = document.querySelectorAll("td[data-day][data-time]");
//     cells.forEach((cell) => {
//       cell.innerHTML = "";
//       cell.style.display = "";
//       cell.rowSpan = 1; // Reset rowSpan
//       cell.style.backgroundColor = "";
//     });
//   };

//   clearCalendar(); // Reset calendar before rendering

//   data.forEach((course) => {
//     const {
//       COURSE_NUMBER,
//       TITLE_START_DATE,
//       START_TIME,
//       END_TIME,
//       MEETING_DAYS,
//       BUILDING,
//       ROOM,
//       _id,
//     } = course;

//     if (!START_TIME || !END_TIME || !MEETING_DAYS) {
//       console.warn(`Invalid course data: ${JSON.stringify(course)}`);
//       return;
//     }

//     const roundedStartTime = roundTimeToSlot(START_TIME);
//     const roundedEndTime = roundTimeToSlot(END_TIME);
//     const startMinutes = timeToMinutes(roundedStartTime);
//     const endMinutes = timeToMinutes(roundedEndTime);
//     const rowSpan = calculateRowspan(startMinutes, endMinutes);
//     const days = parseMeetingDays(MEETING_DAYS);

//     console.log(`Course "${COURSE_NUMBER}" spans ${rowSpan} rows from ${roundedStartTime} to ${roundedEndTime} on ${days.join(", ")}`);

//     days.forEach((day) => {
//       // Skip invalid days
//       if (!validDays.includes(day)) {
//         console.warn(`Skipping invalid day: "${day}" for course "${COURSE_NUMBER}"`);
//         return;
//       }

//       const cell = document.querySelector(`td[data-day="${day}"][data-time="${roundedStartTime}"]`);

//       if (!cell) {
//         console.warn(`No matching cell for ${COURSE_NUMBER} on day "${day}" at time "${roundedStartTime}"`);
//         return;
//       }

//       if (cell.innerHTML.trim() !== "") {
//         console.warn(`Conflict detected for ${COURSE_NUMBER} on day "${day}" at time "${roundedStartTime}"`);
//         cell.style.backgroundColor = conflictColor;
//         cell.innerHTML += `<div style="color: red;">Conflict!</div>`;
//         return;
//       }

//       // Populate and span rows
//       console.log(`Placing ${COURSE_NUMBER} in cell for day "${day}" at time "${roundedStartTime}"`);
//       cell.rowSpan = rowSpan;
//       cell.style.backgroundColor = defaultColor;
//       cell.innerHTML = `
//         <strong>${COURSE_NUMBER}</strong><br>
//         ${TITLE_START_DATE}<br>
//         ${START_TIME} - ${END_TIME}<br>
//         ${BUILDING} ${ROOM}<br>
//         <span class="icon-buttons">
//           <i class="material-icons edit-icon" onclick="editCourse('${_id}')">edit</i>
//           <i class="material-icons delete-icon" onclick="deleteCourse('${_id}')">delete</i>
//         </span>
//       `;

//       // Hide cells beneath the spanned row
//       let nextRow = cell.parentNode.nextSibling;
//       for (let i = 1; i < rowSpan && nextRow; i++) {
//         if (nextRow.nodeType === 1) {
//           const extraCell = nextRow.querySelector(`td[data-day="${day}"]`);
//           if (extraCell) {
//             extraCell.style.display = "none";
//           }
//         }
//         nextRow = nextRow.nextSibling;
//       }
//     });
//   });

//   // Final cleanup: Ensure no cells appear after Friday
//   document.querySelectorAll("td").forEach((cell) => {
//     if (!validDays.includes(cell.dataset.day)) {
//       cell.style.display = "none"; // Hide invalid cells
//     }
//   });
// };

// const displayCourses = (data) => {
//   console.clear();
//   console.log("Loaded courses:", data);

//   const conflictColor = "#ffcccc"; // Highlight conflicts
//   const defaultColor = "#ffffff"; // Default cell color
//   const validDays = ["M", "T", "W", "TH", "F"]; // Valid days for the calendar

//   const parseTime = (time) => {
//     const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
//     if (!match) {
//       console.error(`Invalid time format: "${time}"`);
//       return null;
//     }
//     let [, hour, minute, period] = match;
//     hour = parseInt(hour, 10);
//     minute = parseInt(minute, 10);

//     if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
//     if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

//     return { hour, minute };
//   };

//   const timeToMinutes = (time) => {
//     const parsedTime = parseTime(time);
//     return parsedTime ? parsedTime.hour * 60 + parsedTime.minute : NaN;
//   };

//   const roundTimeToSlot = (time) => {
//     const parsedTime = parseTime(time);
//     if (!parsedTime) return null;

//     let { hour, minute } = parsedTime;
//     minute = minute >= 30 ? 30 : 0; // Round to the nearest 30 minutes
//     return `${hour % 12 || 12}:${minute.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
//   };

//   const calculateRowspan = (startMinutes, endMinutes) => {
//     return Math.ceil((endMinutes - startMinutes) / 30); // Each row = 30 minutes
//   };

//   const parseMeetingDays = (days) => {
//     const regex = /\bTH\b|[MTWF]/g;
//     const matchedDays = days.match(regex) || [];

//     return matchedDays.map((day) => {
//       switch (day) {
//         case "M":
//         case "T":
//         case "W":
//         case "TH":
//         case "F":
//           return day;
//         default:
//           console.warn(`Unexpected day code: "${day}"`);
//           return null;
//       }
//     }).filter(Boolean);
//   };

//   const clearCalendar = () => {
//     const cells = document.querySelectorAll("td[data-day][data-time]");
//     cells.forEach((cell) => {
//       cell.innerHTML = "";
//       cell.style.display = "";
//       cell.rowSpan = 1; // Reset rowSpan
//       cell.style.backgroundColor = "";
//     });
//   };

//   clearCalendar(); // Reset calendar before rendering

//   data.forEach((course) => {
//     const {
//       COURSE_NUMBER,
//       TITLE_START_DATE,
//       START_TIME,
//       END_TIME,
//       MEETING_DAYS,
//       BUILDING,
//       ROOM,
//       _id,
//     } = course;

//     if (!START_TIME || !END_TIME || !MEETING_DAYS) {
//       console.warn(`Invalid course data: ${JSON.stringify(course)}`);
//       return;
//     }

//     const roundedStartTime = roundTimeToSlot(START_TIME);
//     const roundedEndTime = roundTimeToSlot(END_TIME);
//     const startMinutes = timeToMinutes(roundedStartTime);
//     const endMinutes = timeToMinutes(roundedEndTime);
//     const rowSpan = calculateRowspan(startMinutes, endMinutes);
//     const days = parseMeetingDays(MEETING_DAYS);

//     console.log(`Course "${COURSE_NUMBER}" spans ${rowSpan} rows from ${roundedStartTime} to ${roundedEndTime} on ${days.join(", ")}`);

//     days.forEach((day) => {
//       // Skip invalid days
//       if (!validDays.includes(day)) {
//         console.warn(`Skipping invalid day: "${day}" for course "${COURSE_NUMBER}"`);
//         return;
//       }

//       const cell = document.querySelector(`td[data-day="${day}"][data-time="${roundedStartTime}"]`);

//       if (!cell) {
//         console.warn(`No matching cell for ${COURSE_NUMBER} on day "${day}" at time "${roundedStartTime}"`);
//         return;
//       }

//       if (cell.innerHTML.trim() !== "") {
//         console.warn(`Conflict detected for ${COURSE_NUMBER} on day "${day}" at time "${roundedStartTime}"`);
//         cell.style.backgroundColor = conflictColor;
//         cell.innerHTML += `<div style="color: red;">Conflict!</div>`;
//         return;
//       }

//       // Populate and span rows
//       console.log(`Placing ${COURSE_NUMBER} in cell for day "${day}" at time "${roundedStartTime}"`);
//       cell.rowSpan = rowSpan;
//       cell.style.backgroundColor = defaultColor;
//       cell.innerHTML = `
//         <strong>${COURSE_NUMBER}</strong><br>
//         ${TITLE_START_DATE}<br>
//         ${START_TIME} - ${END_TIME}<br>
//         ${BUILDING} ${ROOM}<br>
//         <span class="icon-buttons">
//           <i class="material-icons edit-icon" onclick="editCourse('${_id}')">edit</i>
//           <i class="material-icons delete-icon" onclick="deleteCourse('${_id}')">delete</i>
//         </span>
//       `;

      
//       // Hide cells beneath the spanned row
//       let nextRow = cell.parentNode.nextElementSibling;
//       for (let i = 1; i < rowSpan && nextRow; i++) {
//         if (nextRow.nodeType === 1) {
//           const extraCell = nextRow.querySelector(`td[data-day="${day}"]`);
//           if (extraCell) {
//             extraCell.style.display = "none";
//             extraCell.rowSpan = 1; // Reset rowSpan
//           }
//         }
//         nextRow = nextRow.nextElementSibling;
//       }
//     });
//   });

//   // Final cleanup: Ensure no cells appear after Friday
//   document.querySelectorAll("td").forEach((cell) => {
//     if (!validDays.includes(cell.dataset.day)) {
//       cell.style.display = "none"; // Hide invalid cells
//     }
//   });
// };


const displayCourses = (data) => {
  console.clear();
  console.log("Loaded courses:", data);

  const conflictColor = "#ffcccc"; // Highlight conflicts
  const defaultColor = "#ffffff"; // Default cell color
  const validDays = ["M", "T", "W", "TH", "F"]; // Valid days for the calendar

  const parseTime = (time) => {
    const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (!match) {
      console.error(`Invalid time format: "${time}"`);
      return null;
    }
    let [, hour, minute, period] = match;
    hour = parseInt(hour, 10);
    minute = parseInt(minute, 10);

    if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

    return { hour, minute };
  };

  const timeToMinutes = (time) => {
    const parsedTime = parseTime(time);
    return parsedTime ? parsedTime.hour * 60 + parsedTime.minute : NaN;
  };

  const roundTimeToSlot = (time) => {
    const parsedTime = parseTime(time);
    if (!parsedTime) return null;

    let { hour, minute } = parsedTime;
    minute = minute >= 30 ? 30 : 0; // Round to the nearest 30 minutes
    return `${hour % 12 || 12}:${minute.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const calculateRowspan = (startMinutes, endMinutes) => {
    return Math.ceil((endMinutes - startMinutes) / 30); // Each row = 30 minutes
  };

  const parseMeetingDays = (days) => {
    const regex = /\bTH\b|[MTWF]/g;
    const matchedDays = days.match(regex) || [];

    return matchedDays.map((day) => {
      switch (day) {
        case "M":
        case "T":
        case "W":
        case "TH":
        case "F":
          return day;
        default:
          console.warn(`Unexpected day code: "${day}"`);
          return null;
      }
    }).filter(Boolean);
  };

  const clearCalendar = () => {
    const cells = document.querySelectorAll("td[data-day][data-time]");
    cells.forEach((cell) => {
      cell.innerHTML = "";
      cell.style.display = "";
      cell.rowSpan = 1; // Reset rowSpan
      cell.style.backgroundColor = "";
    });
  };

  clearCalendar(); // Reset calendar before rendering

  data.forEach((course) => {
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

    const roundedStartTime = roundTimeToSlot(START_TIME);
    const roundedEndTime = roundTimeToSlot(END_TIME);
    const startMinutes = timeToMinutes(roundedStartTime);
    const endMinutes = timeToMinutes(roundedEndTime);
    const rowSpan = calculateRowspan(startMinutes, endMinutes);
    const days = parseMeetingDays(MEETING_DAYS);

    console.log(`Course "${COURSE_NUMBER}" spans ${rowSpan} rows from ${roundedStartTime} to ${roundedEndTime} on ${days.join(", ")}`);

    days.forEach((day) => {
      // Skip invalid days
      if (!validDays.includes(day)) {
        console.warn(`Skipping invalid day: "${day}" for course "${COURSE_NUMBER}"`);
        return;
      }

      const cell = document.querySelector(`td[data-day="${day}"][data-time="${roundedStartTime}"]`);

      if (!cell) {
        console.warn(`No matching cell for ${COURSE_NUMBER} on day "${day}" at time "${roundedStartTime}"`);
        return;
      }

      if (cell.innerHTML.trim() !== "") {
        console.warn(`Conflict detected for ${COURSE_NUMBER} on day "${day}" at time "${roundedStartTime}"`);
        
        // Extract the existing course details from the cell
        const existingCourse = cell.querySelector("div");
        const existingCourseText = existingCourse ? existingCourse.innerHTML : "Unknown Course";
      
        // Create a new conflict div
        const conflictDiv = document.createElement("div");
        conflictDiv.style.backgroundColor = conflictColor; // Highlight conflict
        conflictDiv.style.padding = "5px";
        conflictDiv.style.borderRadius = "5px";
        conflictDiv.style.color = "black";
      
        conflictDiv.innerHTML = `
          <strong>Conflict!</strong><br>
          <strong>${COURSE_NUMBER}</strong><br>
          ${TITLE_START_DATE}<br>
          ${START_TIME} - ${END_TIME}<br>
          ${BUILDING || "undefined"} ${ROOM || "undefined"}
          <hr>
          <small>Existing: ${existingCourseText}</small>
        `;
      
        // Replace existing content with the conflict details
        cell.innerHTML = ""; // Clear current content
        cell.appendChild(conflictDiv);
      
        return;
      }
      

      // Create a div to wrap course details
      const courseDiv = document.createElement("div");
      courseDiv.innerHTML = `
        <strong>${COURSE_NUMBER}</strong><br>
        ${TITLE_START_DATE}<br>
        ${START_TIME} - ${END_TIME}<br>
        ${BUILDING} ${ROOM}<br>
        <span class="icon-buttons">
          <i class="material-icons edit-icon" onclick="editCourse('${_id}')">edit</i>
          <i class="material-icons delete-icon" onclick="deleteCourse('${_id}')">delete</i>
        </span>
      `;

      // Apply custom color for MATH and PHYS courses only
      if (COURSE_NUMBER.includes("MATH")) {
        courseDiv.style.backgroundColor = "#FFD700"; // Yellow for MATH courses
      } else if (COURSE_NUMBER.includes("PHYS")) {
        courseDiv.style.backgroundColor = "#ADD8E6"; // Light blue for PHYS courses
      }
      courseDiv.style.padding = "5px"; // Add padding for better appearance
      courseDiv.style.borderRadius = "5px"; // Add slight rounding for visual appeal

      // Add the styled div to the cell
      cell.appendChild(courseDiv);

      // Span rows and hide extra cells
      cell.rowSpan = rowSpan;
      let nextRow = cell.parentNode.nextElementSibling;
      for (let i = 1; i < rowSpan && nextRow; i++) {
        if (nextRow.nodeType === 1) {
          const extraCell = nextRow.querySelector(`td[data-day="${day}"]`);
          if (extraCell) {
            extraCell.style.display = "none";
            extraCell.rowSpan = 1; // Reset rowSpan
          }
        }
        nextRow = nextRow.nextElementSibling;
      }
    });
  });

  // Final cleanup: Ensure no cells appear after Friday
  document.querySelectorAll("td").forEach((cell) => {
    if (!validDays.includes(cell.dataset.day)) {
      cell.style.display = "none"; // Hide invalid cells
    }
  });
};


const deleteCourse = async (courseId) => {
  if (confirm("Are you sure you want to delete this course?")) {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        alert(result.message);
        // Refresh the course list
        fetchCourses();
      } else {
        alert("Failed to delete the course: " + result.message);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("An error occurred while deleting the course.");
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const saveButton = document.getElementById("saveButton");
  if (saveButton) {
    saveButton.addEventListener("click", saveCourseChanges);
    console.log("Save button listener added");
  } else {
    console.error("Save button not found");
  }
});

// Show the modal and populate with course data
const editCourse = (courseId) => {
  console.log("Edit course triggered for ID:", courseId);

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
  document.getElementById("building").value = course.BUILDING;
  document.getElementById("room").value = course.ROOM;

  const modalElement = document.getElementById("editCourseModal");
  const modal = new bootstrap.Modal(modalElement, { backdrop: "static" });
  modal.show();
};

// Function to save course changes
const saveCourseChanges = async () => {
  if (!currentEditingCourseId) {
    alert("No course is being edited");
    return;
  }

  const updatedCourse = {
    COURSE_NUMBER: document.getElementById("courseNumber").value,
    TITLE_START_DATE: document.getElementById("courseTitle").value,
    START_TIME: document.getElementById("startTime").value,
    END_TIME: document.getElementById("endTime").value,
    BUILDING: document.getElementById("building").value,
    ROOM: document.getElementById("room").value,
  };

  try {
    const response = await fetch(`/api/courses/${currentEditingCourseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCourse),
    });

    const result = await response.json();
    if (result.success) {
      alert("Course updated successfully");
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editCourseModal")
      );
      modal.hide(); // Hide modal on successful save
      fetchCourses(); // Refresh courses
    } else {
      alert("Failed to update the course");
    }
  } catch (error) {
    console.error("Error saving course changes:", error);
    alert("An error occurred while saving the course");
  }
};

// Function to close the modal
const closeModal = () => {
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("editCourseModal")
  );
  if (modal) {
    modal.hide();
  }
};

document.addEventListener("keydown", function (event) {
  const modalElement = document.getElementById("editCourseModal");
  const modalInstance = bootstrap.Modal.getInstance(modalElement);

  if (event.key === "Escape" && modalInstance) {
    modalInstance.hide(); // Hide the modal on 'ESC' press
  }
});

// Event listeners for dropdown changes
document
  .getElementById("course-catalog-dropdown")
  .addEventListener("change", fetchCourses);
document
  .getElementById("student-year-dropdown")
  .addEventListener("change", fetchCourses);
document
  .getElementById("student-semester-dropdown")
  .addEventListener("change", fetchCourses);

// document.querySelectorAll("tr").forEach((row, index) => {
//   console.log(`Row ${index}:`, row.innerHTML);
// });

// Call fetchCourses initially when the page loads
fetchCourses();
