// Function to fetch courses based on selected course and year
const fetchCourses = async () => {
    try {
        const selectedCourse = document.getElementById('course-catalog-dropdown').value;
        const selectedYear = document.getElementById('student-year-dropdown').value;
        
        // Check if the selected course is "Computer Science" and the selected year is "Freshman"
        if (selectedCourse === "computer-science" && selectedYear === "freshman") {
            const response = await fetch(`/api/courses`);
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            const courses = await response.json();
            displayCourses(courses); // Display the fetched courses
        } else if (selectedCourse === "computer-science-software-engineering" && selectedYear === "freshman") {
            const response = await fetch(`/api/courses`);
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            const courses = await response.json();
            displayCourses(courses); // Display the fetched courses
        }
        else  {
            // Clear the course catalog if conditions are not met
            const courseCatalog = document.getElementById('course-catalog');
            courseCatalog.innerHTML = '';
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

// Function to display courses below the dropdowns
const displayCourses = (courses) => {
    const courseCatalog = document.getElementById('course-catalog');
    // Clear previous courses
    courseCatalog.innerHTML = '';
    // Display fetched courses
    courses.forEach(course => {
        // Check if the course number matches the required pattern
        if (course.COURSE_NUMBER.startsWith('CIS_180') || course.COURSE_NUMBER.startsWith('CIS_181') || course.COURSE_NUMBER.startsWith('CIS_290')) {
            const option = document.createElement('option');
            
            option.textContent = `${course.COURSE_NUMBER} - ${course.TITLE_START_DATE}`;
            courseCatalog.appendChild(option);
        }
    });
};

// Event listeners for dropdown changes
document.getElementById('course-catalog-dropdown').addEventListener('change', fetchCourses);
document.getElementById('student-year-dropdown').addEventListener('change', fetchCourses);

// Call fetchCourses initially when the page loads
fetchCourses();
