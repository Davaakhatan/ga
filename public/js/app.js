// Function to fetch courses based on selected course and year
// const fetchCourses = async () => {
//     try {
//         const selectedCourse = document.getElementById('course-catalog-dropdown').value;
//         const selectedYear = document.getElementById('student-year-dropdown').value;
        
//         // Check if the selected course is "Computer Science" and the selected year is "Freshman"
//         if (selectedCourse === "computer-science" && selectedYear === "freshman") {
//             const response = await fetch(`/api/courses`);
//             if (!response.ok) {
//                 throw new Error('Failed to fetch courses');
//             }
//             const courses = await response.json();
//             displayCourses(courses); // Display the fetched courses
//         } else if (selectedCourse === "computer-science-software-engineering" && selectedYear === "freshman") {
//             const response = await fetch(`/api/courses`);
//             if (!response.ok) {
//                 throw new Error('Failed to fetch courses');
//             }
//             const courses = await response.json();
//             displayCourses(courses); // Display the fetched courses
//         } else if (selectedCourse === "cybersecurity" && selectedYear === "freshman") {
//             const response = await fetch(`/api/courses`);
//             if (!response.ok) {
//                 throw new Error('Failed to fetch courses');
//             }
//             const courses = await response.json();
//             displayCourses(courses); // Display the fetched courses
//         }
//         else  {
//             // Clear the course catalog if conditions are not met
//             const courseCatalog = document.getElementById('course-catalog');
//             courseCatalog.innerHTML = '';
//         }
//     } catch (error) {
//         console.error('Error fetching courses:', error);
//     }
// };

// // Function to display courses below the dropdowns
// const displayCourses = (courses) => {
//     const courseCatalog = document.getElementById('course-catalog');
//     // Clear previous courses
//     courseCatalog.innerHTML = '';
//     // Display fetched courses
//     courses.forEach(course => {
//         // Check if the course number matches the required pattern
//         if (course.COURSE_NUMBER.startsWith('CIS_180') || course.COURSE_NUMBER.startsWith('CIS_181') || course.COURSE_NUMBER.startsWith('CIS_290')) {
//             const option = document.createElement('option');
            
//             option.textContent = `${course.COURSE_NUMBER} - ${course.TITLE_START_DATE}`;
//             courseCatalog.appendChild(option);
//         }
//     });
// };

// // Event listeners for dropdown changes
// document.getElementById('course-catalog-dropdown').addEventListener('change', fetchCourses);
// document.getElementById('student-year-dropdown').addEventListener('change', fetchCourses);

// // Call fetchCourses initially when the page loads
// fetchCourses();

// Function to fetch courses based on selected course and year
const fetchCourses = async () => {
    try {
        const selectedCourse = document.getElementById('course-catalog-dropdown').value;
        const selectedYear = document.getElementById('student-year-dropdown').value;
        const selectedSemester = document.getElementById('student-semester-dropdown').value;
        const courseCatalog = document.getElementById('course-catalog');

        // Clear previous courses
        courseCatalog.innerHTML = '';
        // Clear previous courses from the calendar
        clearCalendar();

        let url;
        if (selectedCourse === "computer-science" || selectedCourse === "computer-science-software-engineering") {
            if (selectedYear === "freshman") {
                // Use the API endpoint that fetches CIS courses with specific fields
                url = '/api/courses';
            }
        } else if (selectedCourse === "cybersecurity") {
            if (selectedYear === "freshman") {
                url = `/api/catalog/Cybersecurity`;
            }
        } else {
            // Clear the course catalog if conditions are not met
            courseCatalog.innerHTML = '';
            return;
        }

        if (url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch from ${url}`);
            }
            const data = await response.json();
            console.log('Fetched data:', data);
            displayCourses(data);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

const clearCalendar = () => {
    const cells = document.querySelectorAll('td[data-day][data-time]');
    cells.forEach(cell => {
        cell.innerHTML = '';
    });
};


const displayCourses = (data) => {
    data.forEach(course => {
        console.log('Processing course:', course);

        if (course.COURSE_NUMBER && course.COURSE_NUMBER.startsWith('CIS_')) {
            const { TITLE_START_DATE, START_TIME, END_TIME, MEETING_DAYS } = course;

            if (MEETING_DAYS) {
                // Normalize time format
                const normalizedStartTime = START_TIME.replace(/([AP]M)/, ' $1');
                const normalizedEndTime = END_TIME.replace(/([AP]M)/, ' $1');

                // Normalize MEETING_DAYS to match HTML attribute values
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

                console.log('Meeting days:', days);

                days.forEach(day => {
                    console.log(`Trying to find cell for ${day} at ${normalizedStartTime}`);
                    
                    // Select the cell in the calendar corresponding to the day and time
                    const dayCell = document.querySelector(`td[data-day="${day}"][data-time="${normalizedStartTime}"]`);
                    console.log(`Selector: td[data-day="${day}"][data-time="${normalizedStartTime}"]`, dayCell);

                    if (dayCell) {
                        console.log(`Found cell for ${day} at ${normalizedStartTime}`);
                        const courseDiv = document.createElement('div');
                        courseDiv.style.marginBottom = '8px';
                        courseDiv.innerHTML = `
                            <strong>${course.COURSE_NUMBER}</strong><br>
                            ${TITLE_START_DATE ? TITLE_START_DATE : 'No Title'}<br>
                            ${normalizedStartTime} - ${normalizedEndTime}
                        `;
                        dayCell.appendChild(courseDiv);
                    } else {
                        console.warn(`No cell found for ${day} at ${normalizedStartTime}`);
                    }
                });
            } else {
                console.error('MEETING_DAYS is undefined for course:', course.COURSE_NUMBER);
            }
        }
    });
};


document.getElementById('course-catalog-dropdown').addEventListener('change', fetchCourses);
document.getElementById('student-year-dropdown').addEventListener('change', fetchCourses);
document.getElementById('student-semester-dropdown').addEventListener('change', fetchCourses);

// Call fetchCourses initially when the page loads
fetchCourses();


// const displayCourses = (data, source, selectedYear, selectedSemester) => {
//     const courseCatalog = document.getElementById('course-catalog');
//     courseCatalog.innerHTML = ''; // Clear previous content

//     if (source.includes('courses')) {
//         // Display only CIS courses with specific fields
//         data.forEach(course => {
//             const courseElement = document.createElement('div');
//             courseElement.className = 'course-item';
//             courseElement.innerHTML = `
//                 <strong>${course.COURSE_NUMBER} - ${course.TITLE_START_DATE}</strong><br>
//                 Time: ${course.START_TIME} - ${course.END_TIME}<br>
//                 Days: ${course.MEETING_DAYS}
//             `;
//             courseCatalog.appendChild(courseElement);
//         });
//     } else if (source.includes('catalog')) {
//         // Display catalog data
//         const yearData = data[selectedYear] || {};
//         const termData = yearData[selectedSemester] || [];

//         termData.forEach(course => {
//             const option = document.createElement('option');
//             option.textContent = `${course.course} - ${course.credits} credits`;
//             courseCatalog.appendChild(option);
//         });
//     }
// };

// const convertTo24HourFormat = (time) => {