// public/js/app.js

// -------------------------
// State & Setup
// -------------------------
let coursesData = [];
let currentEditingCourseId = null;
const uniqueRooms = new Set();
const $ = id => document.getElementById(id);
console.log("app.js loaded");



// -------------------------
// Helper Functions
// -------------------------

function getCourseDefaults(course) {
  return {
    START_TIME:   course.START_TIME   || "08:00 AM",
    END_TIME:     course.END_TIME     || "09:00 AM",
    MEETING_DAYS: course.MEETING_DAYS || "M",
  };
}

function parseTime(ts) {
  const m = ts.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let [_, h, min, p] = m;
  let hour = parseInt(h,10), minute = parseInt(min,10);
  if (p.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (p.toUpperCase() === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function formatTo30(hour24, minute) {
  const m = minute < 30 ? 0 : 30;
  const h = hour24;
  const hour12 = (h % 12) === 0 ? 12 : (h % 12);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour12}:${m.toString().padStart(2,'0')} ${ampm}`;
}

function parseMeetingDays(str) {
  const map = { M: "Monday", T: "Tuesday", W: "Wednesday", TH: "Thursday", F: "Friday" };
  const parts = str.toUpperCase().replace(/TTH/, "T TH").split(/\s+/);
  const codes = parts.flatMap(p =>
    p === "TH" ? ["TH"] : (p.length > 1 ? p.split("") : [p])
  );
  return [...new Set(codes.filter(c => map[c]).map(c => map[c]))];
}

function calcRowspan(startMin, endMin) {
  return Math.ceil((endMin - startMin) / 30);
}

function clearCalendar() {
  document.querySelectorAll("td.day-column").forEach(cell => {
    cell.innerHTML = "";
    cell.style.display = "";
    cell.rowSpan = 1;
  });
}

function populateRoomDropdown() {
  const dd = $("room-dropdown"), prev = dd.value;
  dd.innerHTML = `<option value="">Select a Room</option>`;
  uniqueRooms.forEach(r => {
    if (!r) return;
    const o = document.createElement("option");
    o.value = r; o.textContent = r;
    dd.appendChild(o);
  });
  dd.value = uniqueRooms.has(prev) ? prev : "";
}

// -------------------------
// displayCourses()
// -------------------------

// function displayCourses(courses) {
//   clearCalendar();
//   uniqueRooms.clear();
//   const occupied = {}; // key = "Day-blockStartMin"

//   courses.forEach(course => {
//     if (course.STATUS?.toLowerCase() === "cncl") return;

//     const { START_TIME, END_TIME, MEETING_DAYS } = getCourseDefaults(course);
//     const st = parseTime(START_TIME), et = parseTime(END_TIME);
//     if (!st || !et) {
//       console.warn(`Invalid time for ${course.COURSE_NUMBER}`);
//       return;
//     }

//     // Convert to minutes
//     const startMin = st.hour * 60 + st.minute;
//     const endMin   = et.hour * 60 + et.minute;

//     // Determine grid-aligned blocks
//     const blockStart = Math.floor(startMin / 30) * 30;
//     const blockEnd   = Math.ceil(endMin / 30) * 30;
//     const blocks = [];
//     for (let b = blockStart; b < blockEnd; b += 30) blocks.push(b);
//     const rowSpan = blocks.length;
//     const cellTime = formatTo30(Math.floor(blockStart / 60), blockStart % 60);

//     console.log(`🧩 Placing ${course.COURSE_NUMBER} from ${cellTime} spanning ${rowSpan} blocks`);

//     uniqueRooms.add(course.ROOM);

//     let bg = "#F3F4F6";
//     if (course.COURSE_NUMBER.includes("MATH")) bg = "#FFD700";
//     if (course.COURSE_NUMBER.includes("PHYS")) bg = "#ADD8E6";

//     const courseHTML = `
//       <div class="course-box" style="background:${bg};padding:5px;border-radius:5px;height:100%;box-sizing:border-box;">
//         <strong>${course.COURSE_NUMBER}</strong><br>
//         ${course.TITLE_START_DATE || ""}<br>
//         ${START_TIME} – ${END_TIME}<br>
//         <strong>Building:</strong> ${course.BUILDING || "N/A"}<br>
//         <strong>Room:</strong> ${course.ROOM || "N/A"}<br>
//         <span class="icon-buttons">
//           <i class="material-icons edit-icon" onclick="editCourse('${course._id}')">edit</i>
//           <i class="material-icons delete-icon" onclick="deleteCourse('${course._id}')">delete</i>
//         </span>
//       </div>
//     `;

//     const days = parseMeetingDays(MEETING_DAYS);
//     days.forEach(day => {
//       // Find first block this course occupies that is already taken
//       const conflictBlock = blocks.find(b => occupied[`${day}-${b}`]);
//       const placeBlock = conflictBlock !== undefined ? conflictBlock : blockStart;
//       const placeKey = `${day}-${placeBlock}`;
//       const placeTime = formatTo30(Math.floor(placeBlock / 60), placeBlock % 60);

//       const cell = document.querySelector(`td[data-day="${day}"][data-time="${placeTime}"]`);
//       if (!cell) {
//         console.warn(`❌ No cell for ${course.COURSE_NUMBER} on ${day} ${placeTime}`);
//         return;
//       }

//       // Remove default cell padding
//       cell.style.padding = "0";

//       if (occupied[placeKey]) {
//         // Conflict stacking: append into same cell
//         cell.innerHTML = `
//           <div class="conflict-container" style="display:flex;gap:4px;background:#FFB6C1;padding:4px;border-radius:4px;">
//             ${cell.innerHTML}${courseHTML}
//           </div>`;
//       } else {
//         // Normal place
//         cell.innerHTML = `<div style="height:100%;width:100%;">${courseHTML}</div>`;
//         cell.rowSpan = rowSpan;
//         // Mark all blocks as occupied
//         blocks.forEach(b => { occupied[`${day}-${b}`] = true; });
        
//         // Hide underlying <td> cells for spanned rows
//         let nextRow = cell.parentElement.nextElementSibling;
//         for (let i = 1; i < rowSpan; i++) {
//           nextRow?.querySelector(`td[data-day="${day}"]`)?.style.setProperty("display","none");
//           nextRow = nextRow?.nextElementSibling;
//         }
//       }
//     });
//   });

//   populateRoomDropdown();
// }
// -------------------------

function displayCourses(courses) {
  clearCalendar();
  uniqueRooms.clear();
  const occupied = {}; // key="Day-minute" => true

  courses.forEach(course => {
    if (course.STATUS?.toLowerCase() === "cncl") return;
    const { START_TIME, END_TIME, MEETING_DAYS } = getCourseDefaults(course);
    const st = parseTime(START_TIME), et = parseTime(END_TIME);
    if (!st || !et) {
      console.warn(`Invalid time for ${course.COURSE_NUMBER}`);
      return;
    }
    const days     = parseMeetingDays(MEETING_DAYS);
    const startMin = st.hour * 60 + st.minute;
    const endMin   = et.hour * 60 + et.minute;
    const rowSpan  = calcRowspan(startMin, endMin);

    uniqueRooms.add(course.ROOM);

    // Determine color & conflict
    let bg = "#F3F4F6";
    if (course.COURSE_NUMBER.includes("MATH")) bg = "#FFD700";
    if (course.COURSE_NUMBER.includes("PHYS")) bg = "#ADD8E6";

    // Build HTML once
    const courseHTML = `
      <div class="course-box" style="background:${bg};padding:5px;border-radius:5px;">
        <strong>${course.COURSE_NUMBER}</strong><br>
        ${course.TITLE_START_DATE||""}<br>
        ${START_TIME} – ${END_TIME}<br>
        <strong>Building:</strong> ${course.BUILDING||"N/A"}<br>
        <strong>Room:</strong> ${course.ROOM||"N/A"}<br>
        <span class="icon-buttons">
          <i class="material-icons edit-icon" onclick="editCourse('${course._id}')">edit</i>
          <i class="material-icons delete-icon" onclick="deleteCourse('${course._id}')">delete</i>
        </span>
      </div>
    `;

    // Place for each day
    days.forEach(d => {
      // Find first overlapping block if conflict
      let placeMin = startMin;
      for (let m = startMin; m < endMin; m += 30) {
        if (occupied[`${d}-${m}`]) {
          placeMin = m;
          break;
        }
      }
      const cellTime = formatTo30(Math.floor(placeMin/60), placeMin%60);
      console.log(`🧩 Placing ${course.COURSE_NUMBER} at ${d} ${cellTime}`);

      const cell = document.querySelector(`td[data-day="${d}"][data-time="${cellTime}"]`);
      if (!cell) {
        console.warn(`❌ No cell for ${course.COURSE_NUMBER} on ${d} ${cellTime}`);
        return;
      }

      const key = `${d}-${placeMin}`;
      if (occupied[key]) {
        // Conflict: stack together in same cell
        cell.innerHTML = `
          <div class="conflict-container" style="display:flex;gap:4px;background:#FFB6C1;padding:4px;border-radius:4px;">
            ${cell.innerHTML}${courseHTML}
          </div>`;
      } else {
        // Normal place
        cell.innerHTML = courseHTML;
        cell.rowSpan   = rowSpan;
        occupied[key] = true;
        // hide overlapped rows
        let nr = cell.parentElement.nextElementSibling;
        for (let i = 1; i < rowSpan; i++) {
          nr?.querySelector(`td[data-day="${d}"]`)?.style.setProperty("display","none");
          nr = nr?.nextElementSibling;
        }
      }
    });
  });

  populateRoomDropdown();
}

// -------------------------
// Fetch Courses & Init
// -------------------------

async function fetchCourses() {
  try {
    const prog = $("course-catalog-dropdown").value;
    const yr   = $("student-year-dropdown").value;
    const sem  = $("semester-dropdown").value;
    const rm   = $("room-dropdown").value;
    let url = `/api/courses?year=${yr}&semester=${sem}&course=${prog}`;
    if (rm) url += `&room=${rm}`;
    const res = await fetch(url);
    coursesData = await res.json();
    displayCourses(coursesData);
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ["course-catalog-dropdown","student-year-dropdown","semester-dropdown","room-dropdown"]
    .forEach(id=>$(id).addEventListener("change", fetchCourses));
  fetchCourses();
});

// -------------------------
// Edit / Delete / Export
// -------------------------

function editCourse(id) {
  const c = coursesData.find(x=>x._id===id);
  if (!c) return alert("Course not found.");
  currentEditingCourseId = id;
  $("courseNumber").value  = c.COURSE_NUMBER;
  $("courseTitle").value   = c.TITLE_START_DATE;
  $("meetingDays").value   = c.MEETING_DAYS;
  $("startTime").value     = c.START_TIME;
  $("endTime").value       = c.END_TIME;
  $("buildingInput").value = c.BUILDING||"";
  $("roomInput").value     = c.ROOM||"";
  new bootstrap.Modal($("editCourseModal")).show();
}

async function saveEditedCourse() {
  if (!currentEditingCourseId) return;
  const updated = {
    COURSE_NUMBER: $("courseNumber").value.trim(),
    TITLE_START_DATE: $("courseTitle").value.trim(),
    MEETING_DAYS: $("meetingDays").value.trim(),
    START_TIME: $("startTime").value.trim(),
    END_TIME: $("endTime").value.trim(),
    BUILDING: $("buildingInput").value.trim(),
    ROOM: $("roomInput").value.trim(),
  };
  const res = await fetch(`/api/courses/${currentEditingCourseId}`, {
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(updated)
  });
  const js = await res.json();
  if (js.success) { fetchCourses(); bootstrap.Modal.getInstance($("editCourseModal")).hide(); }
  else alert("Update failed.");
}

document.querySelector("#saveCourseChanges").addEventListener("click", saveEditedCourse);

async function deleteCourse(id) {
  if (!confirm("Delete this course?")) return;
  const res = await fetch(`/api/courses/${id}`, {method:"DELETE"});
  const js = await res.json();
  if (js.success) fetchCourses(); else alert(js.message);
}

async function exportCourses(mode="displayed") {
  let data = [];
  if (mode==="all") {
    const r = await fetch("/api/courses"); data = await r.json();
  } else data = coursesData;
  if (!data.length) return alert("No courses to export.");
  const aoa = [["COURSE#","TITLE","START","END","DAYS","BUILDING","ROOM","INSTR","TERM","STATUS"]];
  data.forEach(c=> aoa.push([c.COURSE_NUMBER,c.TITLE_START_DATE,c.START_TIME,c.END_TIME,c.MEETING_DAYS,c.BUILDING||"",c.ROOM||"",c.INSTRUCTOR||"",c.TERM||"",c.STATUS||""]));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb,ws,"Courses");
  XLSX.writeFile(wb,`${mode}Courses_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// -------------------------
// End of app.js
// -------------------------
