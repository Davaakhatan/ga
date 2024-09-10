
// const fetchCourses = async () => {
//     try {
//         const selectedCourse = document.getElementById('course-catalog-dropdown').value;
//         const selectedYear = document.getElementById('student-year-dropdown').value;
//         const selectedSemester = document.getElementById('student-semester-dropdown').value;
//         const courseCatalog = document.getElementById('course-catalog');

//         // Clear previous courses
//         courseCatalog.innerHTML = '';
//         // Clear previous courses from the calendar
//         clearCalendar();

//         let url;
//         if (selectedCourse === "computer-science" || selectedCourse === "computer-science-software-engineering") {
//             if (selectedYear === "freshman") {
//                 // Use the API endpoint that fetches CIS courses with specific fields
//                 url = '/api/courses';
//             }
//         } else if (selectedCourse === "cybersecurity") {
//             if (selectedYear === "freshman") {
//                 url = `/api/catalog/Cybersecurity`;
//             }
//         } else {
//             // Clear the course catalog if conditions are not met
//             courseCatalog.innerHTML = '';
//             return;
//         }

//         if (url) {
//             const response = await fetch(url);
//             if (!response.ok) {
//                 throw new Error(`Failed to fetch from ${url}`);
//             }
//             const data = await response.json();
//             console.log('Fetched data:', data);
//             displayCourses(data);
//         }
//     } catch (error) {
//         console.error('Error fetching data:', error);
//     }
// };

const fetchCourses = async () => {
    try {
        const selectedCourse = document.getElementById('course-catalog-dropdown').value;
        const selectedYear = document.getElementById('student-year-dropdown').value;
        const courseCatalog = document.getElementById('course-catalog');

        // Clear previous courses
        courseCatalog.innerHTML = '';
        clearCalendar();

        let url = '';

        // Construct the correct URL based on selectedCourse and selectedYear
        if (selectedCourse === "computer-science") {
            if (selectedYear === "freshman") {
                url = '/api/courses?year=freshman';
            } else if (selectedYear === "sophomore") {
                url = '/api/courses?year=sophomore';
            } else if (selectedYear === "junior") {
                url = '/api/courses?year=junior';
            } else if (selectedYear === "senior") {
                url = '/api/courses?year=senior';
            }
        } else if (selectedCourse === "cybersecurity") {
            if (selectedYear === "freshman") {
                url = `/api/catalog/Cybersecurity`;
            } else {
                courseCatalog.innerHTML = 'No data for this selection';
                return;
            }
        } else {
            courseCatalog.innerHTML = 'Please select a valid course and year';
            return;
        }

        // Fetch courses only if a valid URL has been constructed
        if (url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch from ${url}`);
            }

            const data = await response.json();
            console.log('Fetched data:', data);

            // Display the filtered courses
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
        const { COURSE_NUMBER, TITLE_START_DATE, START_TIME, END_TIME, MEETING_DAYS } = course;

        // Normalize and parse time if available
        const normalizedStartTime = START_TIME ? START_TIME.replace(/([AP]M)/, ' $1') : "N/A";
        const normalizedEndTime = END_TIME ? END_TIME.replace(/([AP]M)/, ' $1') : "N/A";

        const parseTime = (time) => {
            const [hourMin, period] = time.split(' ');
            const [hour, minute] = hourMin.split(':');
            return { hour: parseInt(hour), minute: parseInt(minute), period };
        };

        const startTime = parseTime(normalizedStartTime);
        const endTime = parseTime(normalizedEndTime);

        // Determine the appropriate row (round down to the nearest hour)
        const getTimeSlot = (hour, minute, period) => {
            if (minute !== 0) {
                hour = hour === 12 ? 11 : hour; // Handle 12 PM cases
            }
            return `${hour < 10 ? `0${hour}` : hour}:00 ${period}`;
        };

        const timeSlot = getTimeSlot(startTime.hour, startTime.minute, startTime.period);

        // Normalize MEETING_DAYS to match HTML attribute values
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
                // Select the cell in the calendar corresponding to the day and time slot
                const dayCell = document.querySelector(`td[data-day="${day}"][data-time="${timeSlot}"]`);
                if (dayCell) {
                    const courseDiv = document.createElement('div');
                    courseDiv.style.marginBottom = '8px';
                    courseDiv.innerHTML = `
                        <strong>${COURSE_NUMBER}</strong><br>
                        ${TITLE_START_DATE}<br>
                        ${normalizedStartTime} - ${normalizedEndTime}
                    `;
                    dayCell.appendChild(courseDiv);
                }
            });
        } else {
            console.warn(`No meeting days available for course: ${COURSE_NUMBER}`);
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



// const displayCourses = (data) => {
//     data.forEach(course => {
//         console.log('Processing course:', course);

//         if (course.COURSE_NUMBER && course.COURSE_NUMBER.startsWith('CIS_')) {
//             const { TITLE_START_DATE, START_TIME, END_TIME, MEETING_DAYS } = course;

//             if (MEETING_DAYS) {
//                 // Normalize time format
//                 const normalizedStartTime = START_TIME.replace(/([AP]M)/, ' $1');
//                 const normalizedEndTime = END_TIME.replace(/([AP]M)/, ' $1');

//                 // Normalize MEETING_DAYS to match HTML attribute values
//                 const days = MEETING_DAYS.split(' ').map(day => {
//                     switch(day) {
//                         case 'M': return 'M';
//                         case 'T': return 'T';
//                         case 'W': return 'W';
//                         case 'TH': return 'TH';
//                         case 'F': return 'F';
//                         default: return '';
//                     }
//                 });

//                 console.log('Meeting days:', days);

//                 days.forEach(day => {
//                     console.log(`Trying to find cell for ${day} at ${normalizedStartTime}`);
                    
//                     // Select the cell in the calendar corresponding to the day and time
//                     const dayCell = document.querySelector(`td[data-day="${day}"][data-time="${normalizedStartTime}"]`);
//                     console.log(`Selector: td[data-day="${day}"][data-time="${normalizedStartTime}"]`, dayCell);

//                     if (dayCell) {
//                         console.log(`Found cell for ${day} at ${normalizedStartTime}`);
//                         const courseDiv = document.createElement('div');
//                         courseDiv.style.marginBottom = '8px';
//                         courseDiv.innerHTML = `
//                             <strong>${course.COURSE_NUMBER}</strong><br>
//                             ${TITLE_START_DATE ? TITLE_START_DATE : 'No Title'}<br>
//                             ${normalizedStartTime} - ${normalizedEndTime}
//                         `;
//                         dayCell.appendChild(courseDiv);
//                     } else {
//                         console.warn(`No cell found for ${day} at ${normalizedStartTime}`);
//                     }
//                 });s
//             } else {
//                 console.error('MEETING_DAYS is undefined for course:', course.COURSE_NUMBER);
//             }
//         }
//     });
// };

// const displayCourses = (data) => {
//     data.forEach(course => {
//         const { COURSE_NUMBER, TITLE_START_DATE, START_TIME, END_TIME, MEETING_DAYS } = course;

//         // Normalize time if available
//         const normalizedStartTime = START_TIME ? START_TIME.replace(/([AP]M)/, ' $1') : "N/A";
//         const normalizedEndTime = END_TIME ? END_TIME.replace(/([AP]M)/, ' $1') : "N/A";

//         // Normalize MEETING_DAYS to match HTML attribute values
//         if (MEETING_DAYS) {
//             const days = MEETING_DAYS.split(' ').map(day => {
//                 switch(day) {
//                     case 'M': return 'M';
//                     case 'T': return 'T';
//                     case 'W': return 'W';
//                     case 'TH': return 'TH';
//                     case 'F': return 'F';
//                     default: return '';
//                 }
//             });

//             days.forEach(day => {
//                 // Select the cell in the calendar corresponding to the day and time
//                 const dayCell = document.querySelector(`td[data-day="${day}"][data-time="${normalizedStartTime}"]`);
//                 if (dayCell) {
//                     const courseDiv = document.createElement('div');
//                     courseDiv.style.marginBottom = '8px';
//                     courseDiv.innerHTML = `
//                         <strong>${COURSE_NUMBER}</strong><br>
//                         ${TITLE_START_DATE}<br>
//                         ${normalizedStartTime} - ${normalizedEndTime}
//                     `;
//                     dayCell.appendChild(courseDiv);
//                 }
//             });
//         } else {
//             console.warn(`No meeting days available for course: ${COURSE_NUMBER}`);
//         }
//     });
// };