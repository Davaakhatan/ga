let coursesData = [];  // Declare this variable globally to store fetched courses
let currentEditingCourseId = null;  // Store the course ID being edited

console.log("app.js loaded");

// Fetch courses based on selected filters
const fetchCourses = async () => {
    try {
        const selectedCourse = document.getElementById('course-catalog-dropdown').value;
        const selectedYear = document.getElementById('student-year-dropdown').value;
        const selectedSemester = document.getElementById('student-semester-dropdown').value;
        const courseCatalog = document.getElementById('course-catalog');

        // Clear previous courses
        courseCatalog.innerHTML = '';
        clearCalendar();

        let url = `/api/courses?year=${selectedYear}&semester=${selectedSemester}&course=${selectedCourse}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from ${url}`);
        }

        const data = await response.json();
        coursesData = data;  // Store fetched data globally

        if (data.length === 0) {
            courseCatalog.innerHTML = 'No courses found for this selection.';
        } else {
            displayCourses(data);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('course-catalog').innerHTML = '<div class="alert alert-danger">Error fetching courses. Please try again later.</div>';
    }
};

// Function to clear the calendar cells
const clearCalendar = () => {
    const cells = document.querySelectorAll('td[data-day][data-time]');
    cells.forEach(cell => {
        cell.innerHTML = '';
    });
};

// Function to display courses in the calendar
const displayCourses = (data) => {
    const courseCatalog = document.getElementById('course-catalog');
    courseCatalog.innerHTML = '';

    data.forEach(course => {
        const { COURSE_NUMBER, TITLE_START_DATE, START_TIME, END_TIME, MEETING_DAYS, BUILDING, ROOM, _id } = course;

        const normalizedStartTime = START_TIME ? START_TIME.replace(/([AP]M)/, ' $1') : "N/A";
        const normalizedEndTime = END_TIME ? END_TIME.replace(/([AP]M)/, ' $1') : "N/A";

        const parseTime = (time) => {
            const [hourMin, period] = time.split(' ');
            const [hour, minute] = hourMin.split(':');
            return { hour: parseInt(hour), minute: parseInt(minute), period };
        };

        const startTime = parseTime(normalizedStartTime);
        const endTime = parseTime(normalizedEndTime);

        const getTimeSlot = (hour, minute, period) => {
            if (minute !== 0) {
                hour = hour === 12 ? 11 : hour;
            }
            return `${hour < 10 ? `0${hour}` : hour}:00 ${period}`;
        };

        const timeSlot = getTimeSlot(startTime.hour, startTime.minute, startTime.period);

        if (MEETING_DAYS) {
            const days = MEETING_DAYS.split(' ').map(day => {
                switch(day) {
                    case 'M': return 'M';
                    case 'T': return 'T';
                    case 'W': return 'W';
                    case 'TH': return 'TH';
                    case 'F': return 'F';
                    default: return '';
                }
            });

            days.forEach(day => {
                const dayCell = document.querySelector(`td[data-day="${day}"][data-time="${timeSlot}"]`);
                if (dayCell) {
                    const courseDiv = document.createElement('div');
                    courseDiv.style.marginBottom = '8px';
                    courseDiv.innerHTML = `
                        <strong>${COURSE_NUMBER}</strong><br>
                        ${TITLE_START_DATE}<br>
                        ${normalizedStartTime} - ${normalizedEndTime}<br>
                        ${BUILDING} ${ROOM}<br>
                        <span class="icon-buttons">
                            <i class="material-icons edit-icon" style="cursor: pointer;" onclick="editCourse('${_id}')">edit</i>
                            <i class="material-icons delete-icon" style="cursor: pointer;" onclick="deleteCourse('${_id}')">delete</i>
                        </span>
                    `;                
                    dayCell.appendChild(courseDiv);
                }
            });
        } else {
            console.warn(`No meeting days available for course: ${COURSE_NUMBER}`);
        }
    });
};

// Function to delete a course
const deleteCourse = async (courseId) => {
    if (confirm("Are you sure you want to delete this course?")) {
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE',
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

    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', saveCourseChanges);
        console.log("Save button listener added");
    } else {
        console.error("Save button not found");
    }
});

// Show the modal and populate with course data
const editCourse = (courseId) => {
    console.log('Edit course triggered for ID:', courseId);

    const course = coursesData.find(c => c._id === courseId); 
    if (!course) {
        alert("Course not found.");
        return;
    }

    currentEditingCourseId = courseId;
    document.getElementById('courseNumber').value = course.COURSE_NUMBER;
    document.getElementById('courseTitle').value = course.TITLE_START_DATE;
    document.getElementById('startTime').value = course.START_TIME;
    document.getElementById('endTime').value = course.END_TIME;
    document.getElementById('building').value = course.BUILDING;
    document.getElementById('room').value = course.ROOM;

    const modalElement = document.getElementById('editCourseModal');
    const modal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
    modal.show();
};



// Function to save course changes
const saveCourseChanges = async () => {
    if (!currentEditingCourseId) {
        alert('No course is being edited');
        return;
    }

    const updatedCourse = {
        COURSE_NUMBER: document.getElementById('courseNumber').value,
        TITLE_START_DATE: document.getElementById('courseTitle').value,
        START_TIME: document.getElementById('startTime').value,
        END_TIME: document.getElementById('endTime').value,
        BUILDING: document.getElementById('building').value,
        ROOM: document.getElementById('room').value,
    };

    try {
        const response = await fetch(`/api/courses/${currentEditingCourseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCourse),
        });

        const result = await response.json();
        if (result.success) {
            alert('Course updated successfully');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCourseModal'));
            modal.hide();  // Hide modal on successful save
            fetchCourses(); // Refresh courses
        } else {
            alert('Failed to update the course');
        }
    } catch (error) {
        console.error('Error saving course changes:', error);
        alert('An error occurred while saving the course');
    }
};


// Function to close the modal
const closeModal = () => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('editCourseModal'));
    if (modal) {
        modal.hide();
    }
};


document.addEventListener('keydown', function(event) {
    const modalElement = document.getElementById('editCourseModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    
    if (event.key === 'Escape' && modalInstance) {
        modalInstance.hide();  // Hide the modal on 'ESC' press
    }
});


// Event listeners for dropdown changes
document.getElementById('course-catalog-dropdown').addEventListener('change', fetchCourses);
document.getElementById('student-year-dropdown').addEventListener('change', fetchCourses);
document.getElementById('student-semester-dropdown').addEventListener('change', fetchCourses);


// Call fetchCourses initially when the page loads
fetchCourses();
