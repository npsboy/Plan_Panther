// Global variables
let subjects = [];
let adding_new_subject = true;
let edit_subject_no = 0;
let currentMonth = new Date();
let currentYear = new Date().getFullYear();
let today = new Date();
let currentTimetable = null; // Store the generated timetable
let DaysWhenBusy = []; // Array to store busy days
let markBusyMode = false; // Flag for mark busy mode

// localStorage utility functions
function saveToLocalStorage() {
    try {
        localStorage.setItem('planPanther_subjects', JSON.stringify(subjects));
        localStorage.setItem('planPanther_busyDays', JSON.stringify(DaysWhenBusy));
        if (currentTimetable) {
            localStorage.setItem('planPanther_timetable', JSON.stringify(currentTimetable));
        }
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        // Load subjects
        const savedSubjects = localStorage.getItem('planPanther_subjects');
        if (savedSubjects) {
            subjects = JSON.parse(savedSubjects);
            console.log('Loaded subjects from localStorage:', subjects);
        }
        
        // Load busy days
        const savedBusyDays = localStorage.getItem('planPanther_busyDays');
        if (savedBusyDays) {
            DaysWhenBusy = JSON.parse(savedBusyDays);
            console.log('Loaded busy days from localStorage:', DaysWhenBusy);
        }
        
        // Load timetable
        const savedTimetable = localStorage.getItem('planPanther_timetable');
        if (savedTimetable) {
            currentTimetable = JSON.parse(savedTimetable);
            console.log('Loaded timetable from localStorage');
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        // Reset to defaults if there's an error
        subjects = [];
        DaysWhenBusy = [];
        currentTimetable = null;
    }
}

function clearLocalStorage() {
    try {
        localStorage.removeItem('planPanther_subjects');
        localStorage.removeItem('planPanther_busyDays');
        localStorage.removeItem('planPanther_timetable');
        console.log('localStorage cleared');
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This will remove all subjects, busy days, and the generated timetable. This action cannot be undone.')) {
        // Clear in-memory data
        subjects = [];
        DaysWhenBusy = [];
        currentTimetable = null;
        
        // Clear localStorage
        clearLocalStorage();
        
        // Ask if user wants to go back to landing page
        const goToLanding = confirm('Data cleared successfully! Would you like to go back to the welcome screen?');
        
        if (goToLanding) {
            // Go back to landing page
            main();
        } else {
            // Update the UI to show empty state
            display_subjects();
            generate_calendar(); // Regenerate empty calendar
            alert('All data has been cleared successfully.');
        }
    }
}

async function load_page (page){
    response = await fetch(page);
    response_text = await response.text();
    document.getElementById('page').innerHTML = response_text;
}

function change_slider_color() {
    let slider = document.getElementById("subject_difficulty");
    let difficulty_text = document.getElementById("difficulty_text");

    //removes the .green-thumb, .yellow-thumb, .red-thumb classes from the slider
    slider.classList.remove("green_thumb", "yellow_thumb", "red_thumb");
    if(slider.value < 2){
        slider.value = 2;
    }
    if(slider.value == 2){
        slider.classList.add("green_thumb")
        slider.style.background = "linear-gradient(to right, #00B050, #00B050 33%, #2C3E50 33%, #2C3E50 100%)"
        difficulty_text.textContent = "Easy";
    }
    if(slider.value == 3){
        slider.classList.add("yellow_thumb")
        slider.style.background = "linear-gradient(to right, #FFC000, #FFC000 66%, #2C3E50 66%, #2C3E50 100%)"
        difficulty_text.textContent = "Medium";
    }
    if(slider.value == 4){
        slider.classList.add("red_thumb")
        slider.style.background = "linear-gradient(to right, #FF0000, #FF0000 100%, #2C3E50 100%)"
        difficulty_text.textContent = "Hard";
    }
}

async function main() {
    // Check if localStorage has existing data
    const hasExistingData = localStorage.getItem('planPanther_subjects') && 
                           JSON.parse(localStorage.getItem('planPanther_subjects')).length > 0;
    
    if (hasExistingData) {
        // Skip landing page and go directly to input page
        console.log('Existing data found, skipping landing page');
        await load_page("input_page.html");
        setupInputPageListeners();
    } else {
        // Show landing page for new users
        await load_page("landing_page.html");
        setupLandingPageListeners();
    }
}

function setupLandingPageListeners() {
    const getStartedButton = document.querySelector('.btn');
    if (getStartedButton) {
        getStartedButton.addEventListener('click', async () => {
            console.log('Get Started button clicked');
            await load_page("input_page.html");
            console.log('Input page loaded');
            // Set up event listeners for the input page
            setupInputPageListeners();
        });
    } else {
        console.log('Get Started button not found');
    }
}

function setupInputPageListeners() {
    console.log('Setting up input page listeners');
    
    // Load data from localStorage
    loadFromLocalStorage();
    
    // Initialize the subjects display
    display_subjects();
    
    // If we have a saved timetable and subjects, apply it to the calendar
    if (currentTimetable && subjects.length > 0) {
        generate_calendar(); // Generate calendar structure
        update_calendar(currentTimetable); // Apply the saved timetable
    } else if (subjects.length > 0) {
        // If we have subjects but no saved timetable, automatically generate one
        console.log('Subjects found but no timetable, generating automatically...');
        generate_calendar(); // Generate calendar structure
        update_calendar(); // This will generate a new timetable and apply it
    } else {
        generate_calendar(); // Just generate the calendar structure
    }
    
    // Set up slider event listener
    const slider = document.getElementById("subject_difficulty");
    if (slider) {
        slider.addEventListener('input', change_slider_color);
        slider.addEventListener('change', change_slider_color);
        // Initialize slider appearance
        change_slider_color();
    }
    
    // Set up add subject button
    const addButton = document.querySelector('#card .button.add');
    if (addButton) {
        // Remove any existing event listeners by cloning the button
        const newAddButton = addButton.cloneNode(true);
        addButton.parentNode.replaceChild(newAddButton, addButton);
        newAddButton.addEventListener('click', add_subject);
    }
    
    // Set up show card button
    const showCardButton = document.querySelector('#left_menu .button.add');
    if (showCardButton) {
        showCardButton.addEventListener('click', show_card);
    }
    
    // Set up cancel card (background darkener)
    const backgroundDarkener = document.getElementById('background_darkener');
    const card = document.getElementById('card');
    
    if (backgroundDarkener) {
        backgroundDarkener.addEventListener('click', (e) => {
            if (e.target === backgroundDarkener) {
                cancel_card();
            }
        });
    }
    
    // Prevent card from closing when clicking inside the card
    if (card) {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Set up month navigation buttons
    const prevButton = document.getElementById('prev_month');
    const nextButton = document.getElementById('next_month');
    if (prevButton) {
        // Remove any existing event listeners by cloning the button
        const newPrevButton = prevButton.cloneNode(true);
        prevButton.parentNode.replaceChild(newPrevButton, prevButton);
        newPrevButton.addEventListener('click', () => change_month(-1));
    }
    if (nextButton) {
        // Remove any existing event listeners by cloning the button
        const newNextButton = nextButton.cloneNode(true);
        nextButton.parentNode.replaceChild(newNextButton, nextButton);
        newNextButton.addEventListener('click', () => change_month(1));
    }
    
    // Set up submit button
    const submitButton = document.querySelector('.button.submit');
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            console.log('Make Timetable button clicked!'); // Debug
            console.log('Current subjects:', subjects); // Debug
            update_calendar();
        });
    }
    
    // Set up export button
    const exportButton = document.getElementById('export-main-btn');
    if (exportButton) {
        exportButton.addEventListener('click', toggleExportDropdown);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.querySelector('.export-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            const options = document.getElementById('export-options');
            if (options) {
                options.classList.remove('show');
            }
        }
    });
}



function change_month(direction) {
    // Prevent multiple rapid calls
    if (change_month.isProcessing) {
        return;
    }
    change_month.isProcessing = true;
    
    // Create a new date object to avoid modifying the original
    const newMonth = new Date(currentMonth);
    newMonth.setUTCMonth(newMonth.getUTCMonth() + direction);
    currentMonth = newMonth;
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    console.log('Changed month to:', `${monthNames[currentMonth.getUTCMonth()]} ${currentMonth.getUTCFullYear()}`); // Debug
    
    generate_calendar(); // Generate calendar structure
    // If we have a timetable, apply it to the new month view
    if (currentTimetable) {
        update_calendar(currentTimetable);
    }
    
    // Reset the flag after a short delay to prevent rapid clicking
    setTimeout(() => {
        change_month.isProcessing = false;
    }, 200);
}

function show_card() {
    document.getElementById('background_darkener').style.display = 'flex';
}

function cancel_card() {
    document.getElementById('background_darkener').style.display = 'none';
}

function exportToGoogleCalendar() {
    // Placeholder function for Google Calendar export
    alert('Export to Google Calendar functionality to be implemented');
}

function generate_calendar() {
    const calendar = document.getElementById("calendar");
    const currentMonthLabel = document.getElementById("current_month");
    calendar.innerHTML = ""; // Clear existing calendar

    const year = currentMonth.getUTCFullYear();
    const month = currentMonth.getUTCMonth();

    // Update the current month label
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    currentMonthLabel.textContent = `${monthNames[month]} ${year}`;

    const startOfMonth = new Date(Date.UTC(year, month, 1));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0));
    const startDay = startOfMonth.getUTCDay(); // Day of the week the month starts on
    const daysInMonth = endOfMonth.getUTCDate();

    // Calculate overflow dates from the previous month
    const prevMonth = new Date(Date.UTC(year, month - 1, 1));
    const daysInPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const todayString = today.toISOString().split("T")[0]; // Get today's date string for comparison
    
    for (let i = startDay - 1; i >= 0; i--) {
        const date = new Date(Date.UTC(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth(), daysInPrevMonth - i));
        const dayElement = document.createElement("div");
        dayElement.classList.add("calendar-day", "overflow-day");
        // Check if it's Sunday (day 0)
        if (date.getUTCDay() === 0) {
            dayElement.classList.add("sunday");
        }
        dayElement.innerHTML = `<span>${date.getUTCDate()}</span>`;
        dayElement.dataset.date = date.toISOString().split("T")[0];
        
        // Check if this is today's date
        if (dayElement.dataset.date === todayString) {
            dayElement.classList.add("today");
        }
        
        // Check if this day is marked as busy
        if (DaysWhenBusy.includes(dayElement.dataset.date)) {
            dayElement.classList.add("busy");
        }
        
        // Add click event listener for marking busy days
        dayElement.addEventListener('click', function() {
            if (markBusyMode) {
                toggleBusyDay(this);
            }
        });
        
        calendar.appendChild(dayElement);
    }

    // Generate days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day));
        const dayElement = document.createElement("div");
        dayElement.classList.add("calendar-day");
        // Check if it's Sunday (day 0)
        if (date.getUTCDay() === 0) {
            dayElement.classList.add("sunday");
        }
        dayElement.innerHTML = `<span>${day}</span>`;
        dayElement.dataset.date = date.toISOString().split("T")[0];
        
        // Check if this is today's date
        if (dayElement.dataset.date === todayString) {
            dayElement.classList.add("today");
        }
        
        // Check if this day is marked as busy
        if (DaysWhenBusy.includes(dayElement.dataset.date)) {
            dayElement.classList.add("busy");
        }
        
        // Add click event listener for marking busy days
        dayElement.addEventListener('click', function() {
            if (markBusyMode) {
                toggleBusyDay(this);
            }
        });
        
        calendar.appendChild(dayElement);
    }

    // Calculate overflow dates for the next month
    const totalBoxes = startDay + daysInMonth;
    const remainingBoxes = 7 - (totalBoxes % 7);
    const nextMonth = new Date(Date.UTC(year, month + 1, 1));
    if (remainingBoxes < 7) {
        for (let i = 1; i <= remainingBoxes; i++) {
            const date = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), i));
            const dayElement = document.createElement("div");
            dayElement.classList.add("calendar-day", "overflow-day");
            // Check if it's Sunday (day 0)
            if (date.getUTCDay() === 0) {
                dayElement.classList.add("sunday");
            }
            dayElement.innerHTML = `<span>${date.getUTCDate()}</span>`;
            dayElement.dataset.date = date.toISOString().split("T")[0];
            
            // Check if this is today's date
            if (dayElement.dataset.date === todayString) {
                dayElement.classList.add("today");
            }
            
            // Check if this day is marked as busy
            if (DaysWhenBusy.includes(dayElement.dataset.date)) {
                dayElement.classList.add("busy");
            }
            
            // Add click event listener for marking busy days
            dayElement.addEventListener('click', function() {
                if (markBusyMode) {
                    toggleBusyDay(this);
                }
            });
            
            calendar.appendChild(dayElement);
        }
    }
}

function generate_timetable() {
    console.log('Generating timetable for subjects:', subjects); // Debug
    console.log('Days marked as busy:', DaysWhenBusy); // Debug
    if (subjects.length === 0) {
        console.log('No subjects found, returning empty timetable'); // Debug
        return {};
    }

    // Validate that the exam period doesn't exceed 45 days
    if (subjects.length > 1) {
        const examDates = subjects.map(s => new Date(s.date));
        const earliestExamDate = new Date(Math.min(...examDates));
        const latestExamDate = new Date(Math.max(...examDates));
        const daysDifference = Math.ceil((latestExamDate - earliestExamDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference > 45) {
            alert(`Oops! Timetables can’t span more than 45 days.`);
            return {};
        }
    }

    // Step 1: List All Study Days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start from tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Find the latest exam date
    const latestExamDate = new Date(Math.max(...subjects.map(s => new Date(s.date))));
    
    // Get all days from tomorrow to the day before the last test
    const allDays = [];
    const allTimeSlots = []; // Will include Sunday morning and afternoon slots
    const currentDate = new Date(tomorrow);
    while (currentDate < latestExamDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        allDays.push(dateString);
        
        // Check if it's Sunday (day 0)
        if (currentDate.getUTCDay() === 0) {
            // Add two slots for Sunday: morning and afternoon
            allTimeSlots.push(dateString + '_morning');
            allTimeSlots.push(dateString + '_afternoon');
        } else {
            // Regular day gets one slot
            allTimeSlots.push(dateString);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Mark reserved days (day before each test)
    const reservedDays = new Set();
    const reservedTimeSlots = new Set();
    const subjectReservedDays = {};
    subjects.forEach(subject => {
        const examDate = new Date(subject.date);
        const reservedDay = new Date(examDate);
        reservedDay.setDate(examDate.getDate() - 1);
        const reservedDayString = reservedDay.toISOString().split('T')[0];
        
        // Only reserve the day if it's not busy and is within our date range
        if (reservedDay >= tomorrow && !DaysWhenBusy.includes(reservedDayString)) {
            reservedDays.add(reservedDayString);
            subjectReservedDays[subject.name] = reservedDayString;
            
            // If reserved day is Sunday, we'll handle reservation during assignment
            // Don't automatically reserve both slots - let the algorithm distribute them
            if (reservedDay.getUTCDay() !== 0) {
                reservedTimeSlots.add(reservedDayString);
            }
        }
    });
    
    // Get assignable time slots (all slots minus reserved slots and busy days)
    const assignableTimeSlots = allTimeSlots.filter(slot => {
        // Extract the date from the slot (remove time suffix for Sunday slots)
        const slotDate = slot.includes('_') ? slot.split('_')[0] : slot;
        
        // Exclude if slot is reserved or if the day is marked as busy
        return !reservedTimeSlots.has(slot) && !DaysWhenBusy.includes(slotDate);
    });
    
    // Step 2: Calculate Weights
    const subjectWeights = {};
    let totalWeight = 0;
    subjects.forEach((subject, index) => {
        // difficulty ranges from 0-2, let's make it 1-3 for weight calculation
        const difficulty = subject.difficulty + 1;
        // Use importance value of 2 for all subjects
        const importance = 2;
        const weight = difficulty * importance;
        subjectWeights[subject.name] = weight;
        totalWeight += weight;
    });
    
    // Step 3: Allocate Ideal Time Slots (Proportional)
    const idealTimeSlots = {};
    const remainders = {};
    subjects.forEach(subject => {
        const ideal = (assignableTimeSlots.length * subjectWeights[subject.name]) / totalWeight;
        idealTimeSlots[subject.name] = Math.floor(ideal);
        remainders[subject.name] = ideal - Math.floor(ideal);
    });
    
    // Step 4: Cap by Subject's Available Window
    const cappedTimeSlots = {};
    const availableTimeSlotsPerSubject = {};
    subjects.forEach(subject => {
        const examDate = new Date(subject.date);
        // Include all assignable time slots before the exam date, plus exam day slots of other subjects
        const availableSlots = assignableTimeSlots.filter(slot => {
            const slotDate = slot.includes('_') ? slot.split('_')[0] : slot;
            return new Date(slotDate) < examDate;
        });
        
        // Add exam day slots of other subjects that occur before this subject's exam
        subjects.forEach(otherSubject => {
            if (otherSubject.name !== subject.name) {
                const otherExamDate = new Date(otherSubject.date);
                if (otherExamDate < examDate && !DaysWhenBusy.includes(otherSubject.date)) {
                    // Check if other exam is on Sunday
                    if (otherExamDate.getUTCDay() === 0) {
                        availableSlots.push(otherSubject.date + '_morning');
                        availableSlots.push(otherSubject.date + '_afternoon');
                    } else {
                        availableSlots.push(otherSubject.date);
                    }
                }
            }
        });
        
        availableTimeSlotsPerSubject[subject.name] = availableSlots;
        cappedTimeSlots[subject.name] = Math.min(idealTimeSlots[subject.name], availableSlots.length);
    });
    
    // Step 5: Distribute Leftover Time Slots
    const finalAllocation = { ...cappedTimeSlots };
    let usedTimeSlotsCount = Object.values(finalAllocation).reduce((sum, slots) => sum + slots, 0);
    let extraTimeSlots = assignableTimeSlots.length - usedTimeSlotsCount;
    
    while (extraTimeSlots > 0) {
        // Find subjects that can take more time slots
        const eligibleSubjects = subjects.filter(subject => {
            const examDate = new Date(subject.date);
            const availableSlots = availableTimeSlotsPerSubject[subject.name];
            return examDate > tomorrow && finalAllocation[subject.name] < availableSlots.length;
        });
        
        if (eligibleSubjects.length === 0) break;
        
        // Sort by highest remainder, then by highest weight
        eligibleSubjects.sort((a, b) => {
            const remainderDiff = remainders[b.name] - remainders[a.name];
            if (Math.abs(remainderDiff) < 0.001) { // If remainders are nearly equal
                return subjectWeights[b.name] - subjectWeights[a.name];
            }
            return remainderDiff;
        });
        
        // Give one extra time slot to the top subject
        const selectedSubject = eligibleSubjects[0];
        finalAllocation[selectedSubject.name]++;
        extraTimeSlots--;
        
        // Reset remainder to avoid giving multiple slots to the same subject consecutively
        remainders[selectedSubject.name] = 0;
    }
    
    // Create the final timetable by assigning specific time slots
    const timetable = {};
    const usedTimeSlots = new Set();
    
    // First, assign reserved days (day before exam)
    Object.entries(subjectReservedDays).forEach(([subjectName, day]) => {
        // Check if reserved day is Sunday
        const reservedDate = new Date(day);
        if (reservedDate.getUTCDay() === 0) {
            // For Sunday, we'll handle the slots individually during the main assignment
            // Just mark that this day has some reserved slots
            if (!timetable[day]) {
                timetable[day] = [];
            }
        } else {
            timetable[day] = `Study: ${subjectName}`;
        }
    });
    
    // Then assign the allocated study time slots
    subjects.forEach(subject => {
        const examDate = new Date(subject.date);
        
        // Get available time slots: assignable slots before exam + exam day slots of other subjects before this exam
        let availableSlots = assignableTimeSlots.filter(slot => {
            const slotDate = slot.includes('_') ? slot.split('_')[0] : slot;
            return new Date(slotDate) < examDate && !usedTimeSlots.has(slot);
        });
        
        // Add exam day slots of other subjects that occur before this subject's exam and are not already used
        subjects.forEach(otherSubject => {
            if (otherSubject.name !== subject.name) {
                const otherExamDate = new Date(otherSubject.date);
                if (otherExamDate < examDate && !DaysWhenBusy.includes(otherSubject.date)) {
                    if (otherExamDate.getUTCDay() === 0) {
                        // Sunday exam day - add both slots
                        if (!usedTimeSlots.has(otherSubject.date + '_morning')) {
                            availableSlots.push(otherSubject.date + '_morning');
                        }
                        if (!usedTimeSlots.has(otherSubject.date + '_afternoon')) {
                            availableSlots.push(otherSubject.date + '_afternoon');
                        }
                    } else {
                        if (!usedTimeSlots.has(otherSubject.date)) {
                            availableSlots.push(otherSubject.date);
                        }
                    }
                }
            }
        });
        
        // Sort available slots by proximity to exam (closer = later in study schedule)
        availableSlots.sort((a, b) => {
            const dateA = a.includes('_') ? a.split('_')[0] : a;
            const dateB = b.includes('_') ? b.split('_')[0] : b;
            return new Date(dateB) - new Date(dateA);
        });
        
        const slotsToAssign = finalAllocation[subject.name];
        let assignedSlots = 0;
        
        // First, handle reserved day priority if this subject has a reserved Sunday
        const reservedDay = subjectReservedDays[subject.name];
        if (reservedDay) {
            const reservedDate = new Date(reservedDay);
            if (reservedDate.getUTCDay() === 0) {
                // This subject has priority for Sunday slots
                // Try to assign at least one Sunday slot to this subject
                const morningSlot = reservedDay + '_morning';
                const afternoonSlot = reservedDay + '_afternoon';
                
                if (assignedSlots < slotsToAssign && !usedTimeSlots.has(morningSlot)) {
                    if (!timetable[reservedDay]) {
                        timetable[reservedDay] = [];
                    }
                    timetable[reservedDay].push(`Study: ${subject.name} (Morning)`);
                    usedTimeSlots.add(morningSlot);
                    assignedSlots++;
                }
                
                if (assignedSlots < slotsToAssign && !usedTimeSlots.has(afternoonSlot)) {
                    if (!timetable[reservedDay]) {
                        timetable[reservedDay] = [];
                    }
                    timetable[reservedDay].push(`Study: ${subject.name} (Afternoon)`);
                    usedTimeSlots.add(afternoonSlot);
                    assignedSlots++;
                }
            } else {
                // Regular reserved day
                if (assignedSlots < slotsToAssign && !usedTimeSlots.has(reservedDay)) {
                    timetable[reservedDay] = `Study: ${subject.name}`;
                    usedTimeSlots.add(reservedDay);
                    assignedSlots++;
                }
            }
        }
        
        // Then assign remaining slots from available slots
        for (let i = 0; i < availableSlots.length && assignedSlots < slotsToAssign; i++) {
            const slot = availableSlots[i];
            
            // Skip if slot is already used
            if (usedTimeSlots.has(slot)) {
                continue;
            }
            
            // Extract date and time from slot
            if (slot.includes('_')) {
                // Sunday slot
                const [date, timeOfDay] = slot.split('_');
                const timeLabel = timeOfDay === 'morning' ? 'Morning' : 'Afternoon';
                
                if (!timetable[date]) {
                    timetable[date] = [];
                }
                if (Array.isArray(timetable[date])) {
                    timetable[date].push(`Study: ${subject.name} (${timeLabel})`);
                } else {
                    // Convert existing single entry to array
                    timetable[date] = [timetable[date], `Study: ${subject.name} (${timeLabel})`];
                }
            } else {
                // Regular day slot
                timetable[slot] = `Study: ${subject.name}`;
            }
            usedTimeSlots.add(slot);
            assignedSlots++;
        }
    });
    
    // Add exam days to the timetable, but check if they already have study sessions
    subjects.forEach(subject => {
        const existingEvent = timetable[subject.date];
        if (existingEvent && existingEvent.startsWith('Study:')) {
            // There's already a study session on this day, combine them
            const studySubject = existingEvent.split(': ')[1];
            timetable[subject.date] = `Exam: ${subject.name}, Study: ${studySubject}`;
        } else {
            // No existing study session, just add the exam
            timetable[subject.date] = `Exam: ${subject.name}`;
        }
    });
    
    console.log('Final timetable object:', timetable); // Debug
    console.log('Number of entries in timetable:', Object.keys(timetable).length); // Debug
    
    return timetable;
}

function update_calendar(timetable) {
    console.log('update_calendar called'); // Debug
    
    const calendarDays = document.querySelectorAll(".calendar-day");
    console.log('Found calendar days:', calendarDays.length); // Debug
    
    if (calendarDays.length === 0) {
        console.log('No calendar days found! Calendar might not be generated yet.'); // Debug
        return;
    }
    
    // If no timetable is provided, generate one
    if (!timetable) {
        console.log('No timetable provided, generating...'); // Debug
        timetable = generate_timetable();
        currentTimetable = timetable; // Store the generated timetable
        // Save the generated timetable to localStorage
        saveToLocalStorage();
        console.log('Generated timetable:', timetable); // Debug
    } else {
        // If timetable is provided, store it as current timetable
        currentTimetable = timetable;
        // Save to localStorage
        saveToLocalStorage();
    }
    
    if (Object.keys(timetable).length === 0) {
        console.log('Timetable is empty'); // Debug
        return;
    }

    calendarDays.forEach(day => {
        const dayDate = day.dataset.date;
        console.log('Processing day:', dayDate); // Debug
        if (dayDate) {
            day.innerHTML = `<span>${new Date(dayDate).getDate()}</span>`; // Reset day content

            // Display events from timetable
            if (timetable[dayDate]) {
                console.log('Found event for', dayDate, ':', timetable[dayDate]); // Debug
                const eventData = timetable[dayDate];
                
                // Check if it's an array (Sunday with multiple slots)
                if (Array.isArray(eventData)) {
                    eventData.forEach(eventText => {
                        // Handle combined events within Sunday slots
                        if (eventText.includes('Exam:') && eventText.includes('Study:')) {
                            const parts = eventText.split(', ');
                            const examPart = parts[0];
                            const studyPart = parts[1];
                            
                            // Create exam event
                            const examEvent = document.createElement("div");
                            examEvent.classList.add("calendar-event");
                            examEvent.textContent = examPart;
                            examEvent.style.backgroundColor = "#FF0000";
                            day.appendChild(examEvent);
                            
                            // Create study event
                            const studyEvent = document.createElement("div");
                            studyEvent.classList.add("calendar-event");
                            studyEvent.textContent = studyPart;
                            const studySubjectName = studyPart.split(": ")[1].split(" (")[0];
                            const studySubject = subjects.find(s => s.name === studySubjectName);
                            if (studySubject) {
                                studyEvent.style.backgroundColor = studySubject.color;
                            }
                            day.appendChild(studyEvent);
                        } else {
                            // Single event within Sunday slot
                            const event = document.createElement("div");
                            event.classList.add("calendar-event");
                            event.textContent = eventText;
                            
                            if (eventText.startsWith('Exam:')) {
                                event.style.backgroundColor = "#FF0000";
                            } else if (eventText.startsWith('Study:')) {
                                const subjectName = eventText.split(": ")[1].split(" (")[0];
                                const subject = subjects.find(s => s.name === subjectName);
                                if (subject) {
                                    event.style.backgroundColor = subject.color;
                                }
                            }
                            day.appendChild(event);
                        }
                    });
                } else {
                    // Single event (string format)
                    const eventText = eventData;
                    
                    // Check if it's a combined exam and study event
                    if (eventText.includes('Exam:') && eventText.includes('Study:')) {
                        // Parse combined event: "Exam: SubjectA, Study: SubjectB"
                        const parts = eventText.split(', ');
                        const examPart = parts[0]; // "Exam: SubjectA"
                        const studyPart = parts[1]; // "Study: SubjectB"
                        
                        // Create exam event
                        const examEvent = document.createElement("div");
                        examEvent.classList.add("calendar-event");
                        examEvent.textContent = examPart;
                        examEvent.style.backgroundColor = "#FF0000"; // Red for exam
                        day.appendChild(examEvent);
                        
                        // Create study event
                        const studyEvent = document.createElement("div");
                        studyEvent.classList.add("calendar-event");
                        studyEvent.textContent = studyPart;
                        const studySubjectName = studyPart.split(": ")[1];
                        const studySubject = subjects.find(s => s.name === studySubjectName);
                        if (studySubject) {
                            studyEvent.style.backgroundColor = studySubject.color;
                        }
                        day.appendChild(studyEvent);
                    } else {
                        // Single event (either exam or study)
                        const event = document.createElement("div");
                        event.classList.add("calendar-event");
                        event.textContent = eventText;
                        
                        if (eventText.startsWith('Exam:')) {
                            event.style.backgroundColor = "#FF0000"; // Red for exam days
                        } else if (eventText.startsWith('Study:')) {
                            const subjectName = eventText.split(": ")[1];
                            const subject = subjects.find(s => s.name === subjectName);
                            if (subject) {
                                event.style.backgroundColor = subject.color; // Use the subject's color for study days
                            }
                        }
                        day.appendChild(event);
                    }
                }
            }
        }
    });
}

// Initialize the landing page on page load
main();

function add_subject(event) {
    // Prevent default form submission and event bubbling
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Prevent multiple rapid calls
    if (add_subject.isProcessing) {
        return;
    }
    add_subject.isProcessing = true;
    
    let subject_name = document.getElementById("subject_name").value.trim();
    let subject_date = document.getElementById("subject_date").value;
    let subject_difficulty = document.getElementById("subject_difficulty").value - 1;
    let subject_append = {};
    let background_darkener = document.getElementById("background_darkener");
    let subject_list_display = document.getElementById("subjects_list");

    if (subject_name == "") {
        alert("Please enter a subject name.");
        add_subject.isProcessing = false; // Reset flag
        return;
    }
    
    // Check for duplicate subject names (case-insensitive)
    const duplicateSubject = subjects.find(subject => 
        subject.name.toLowerCase() === subject_name.toLowerCase() && 
        (adding_new_subject || subjects.indexOf(subject) !== edit_subject_no)
    );
    if (duplicateSubject) {
        alert("Subject already added!");
        add_subject.isProcessing = false; // Reset flag
        return;
    }
    
    if (subject_date == "") {
        alert("Please enter a subject date.");
        add_subject.isProcessing = false; // Reset flag
        return;
    }
    
    // Check for duplicate exam dates
    const duplicateDate = subjects.find(subject => 
        subject.date === subject_date && 
        (adding_new_subject || subjects.indexOf(subject) !== edit_subject_no)
    );
    if (duplicateDate) {
        alert("Another exam is already scheduled for this date!");
        add_subject.isProcessing = false; // Reset flag
        return;
    }
    
    // Check if exam date is at least 2 days from today
    const examDate = new Date(subject_date);
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 2);
    
    // Set times to midnight for proper date comparison
    examDate.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);
    
    if (examDate <= today) {
        alert("Please enter a valid subject date.");
        add_subject.isProcessing = false; // Reset flag
        return;
    } else if (examDate < minDate) {
        alert("First exam is too soon! Give yourself at least 2 days.");
        add_subject.isProcessing = false; // Reset flag
        return;
    } else {
        subject_append.name = subject_name;
        subject_append.date = subject_date;
        subject_append.difficulty = subject_difficulty;
        subject_append.color = getRandomLowSaturationColor(); // Assign a random color

        if (adding_new_subject == true) {
            subjects.push({ ...subject_append });
        } else {
            subjects[edit_subject_no] = { ...subject_append };
        }

        // Save to localStorage after adding/editing subject
        saveToLocalStorage();

        background_darkener.style.display = "none";
        display_subjects();
        // Don't automatically update calendar - wait for "Make Timetable" button
        
        // Clear the form
        document.getElementById("subject_name").value = "";
        document.getElementById("subject_date").value = "";
        document.getElementById("subject_difficulty").value = 2;
        change_slider_color();
    }
    
    // Reset flag after processing
    setTimeout(() => {
        add_subject.isProcessing = false;
    }, 100);
}

function display_subjects() {
    let subject_list_display = document.getElementById("subjects_list");
    if (!subject_list_display) return;
    
    
    if (subjects.length === 0) {
        return;
    }

    // Clear existing subjects display
    subject_list_display.innerHTML = "";
    
    subjects.forEach((subject, index) => {
        let subject_item = document.createElement("div");
        subject_item.style.cssText = `
            margin: 5px 10px;
            padding: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #ddd;
        `;

        // Determine difficulty color
        let difficultyColor = '#00B050'; // Green for Easy (stored as 1)
        let difficultyText = 'Easy';
        if (subject.difficulty === 2) {
            difficultyColor = '#FFC000'; // Yellow/Orange for Medium (stored as 2)
            difficultyText = 'Medium';
        } else if (subject.difficulty === 3) {
            difficultyColor = '#FF0000'; // Red for Hard (stored as 3)
            difficultyText = 'Hard';
        }

        let subject_info = document.createElement("div");
        subject_info.innerHTML = `
            <span style="font-weight: bold;">${index + 1}. ${subject.name}</span> | 
            <span>${subject.date}</span> | 
            <span style="color: ${difficultyColor}; font-weight: bold;">${difficultyText}</span>
        `;

        // Edit button
        let edit_button = document.createElement("img");
        edit_button.src = "edit_icon.png";
        edit_button.style.cssText = `
            width: 16px; 
            height: 16px; 
            cursor: pointer; 
            padding: 4px;
            border-radius: 3px;
        `;
        edit_button.title = "Edit subject";
        edit_button.onclick = () => edit_subject(index);

        // Delete button
        let delete_button = document.createElement("img");
        delete_button.src = "delete.png";
        delete_button.style.cssText = `
            width: 16px;
            height: 16px;
            cursor: pointer;
            padding: 4px;
            border-radius: 3px;
            margin-left: 6px;
        `;
        delete_button.title = "Delete subject";
        delete_button.onclick = () => {
            if (confirm(`Delete subject '${subject.name}'?`)) {
                subjects.splice(index, 1);
                saveToLocalStorage();
                display_subjects();
                // Optionally, update the calendar if timetable exists
                if (typeof update_calendar === 'function') {
                    update_calendar(currentTimetable);
                }
            }
        };

        // Button container
        let button_container = document.createElement("div");
        button_container.style.display = "flex";
        button_container.appendChild(edit_button);
        button_container.appendChild(delete_button);

        subject_item.appendChild(subject_info);
        subject_item.appendChild(button_container);
        subject_list_display.appendChild(subject_item);
    });
}

function show_card() {
    let subject_name = document.getElementById("subject_name");
    let subject_date = document.getElementById("subject_date");
    let subject_difficulty = document.getElementById("subject_difficulty");
    let background_darkener = document.getElementById("background_darkener");
    background_darkener.style.display = "flex";
    subject_name.value = "";
    subject_date.value = "";
    subject_difficulty.value = 2;
    change_slider_color();
    adding_new_subject = true;
}

function cancel_card(e) {
    let background_darkener = document.getElementById("background_darkener");
    if (!e || e.target === background_darkener) {
        background_darkener.style.display = "none";
    }
}

function edit_subject (subject_no){
    edit_subject_no = subject_no;
    adding_new_subject = false; // Important: set to false for editing
    let edit_subject = subjects[subject_no];
    let subject_name = document.getElementById("subject_name");
    let subject_date = document.getElementById("subject_date");
    let subject_difficulty = document.getElementById("subject_difficulty");
    let background_darkener = document.getElementById("background_darkener");
    background_darkener.style.display = "flex";
    subject_name.value = edit_subject.name;
    subject_date.value = edit_subject.date;
    subject_difficulty.value = edit_subject.difficulty + 1; // +1 because the slider starts at 2
    change_slider_color();
}

function getRandomLowSaturationColor() {
    // Helper function to calculate color distance
    function colorDistance(color1, color2) {
        const r1 = parseInt(color1.substring(1, 3), 16);
        const g1 = parseInt(color1.substring(3, 5), 16);
        const b1 = parseInt(color1.substring(5, 7), 16);
        
        const r2 = parseInt(color2.substring(1, 3), 16);
        const g2 = parseInt(color2.substring(3, 5), 16);
        const b2 = parseInt(color2.substring(5, 7), 16);
        
        // Euclidean distance in RGB space
        return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
    }
    
    // Get existing colors from current subjects
    const existingColors = subjects.map(subject => subject.color).filter(color => color);
    
    // Minimum distance required between colors (higher = more different colors)
    const minDistance = 80;
    
    // Maximum attempts to find a unique color
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Define multiple base colors for variety
        const baseColors = [
            [0x6c, 0xcc, 0x86], // Green
            [0x86, 0xcc, 0x6c], // Light green
            [0xcc, 0x86, 0x6c], // Orange-brown
            [0x6c, 0x86, 0xcc], // Blue
            [0xcc, 0x6c, 0x86], // Pink
            [0x86, 0x6c, 0xcc], // Purple
            [0xcc, 0xcc, 0x6c], // Yellow-green
            [0x6c, 0xcc, 0xcc], // Cyan
        ];
        
        // Choose a random base color
        const baseColor = baseColors[Math.floor(Math.random() * baseColors.length)];
        
        // Define a range for variation
        let variation = 50;
        
        // Generate random values within the variation range
        let red = baseColor[0] + Math.floor(Math.random() * (variation * 2 + 1)) - variation;
        let green = baseColor[1] + Math.floor(Math.random() * (variation * 2 + 1)) - variation;
        let blue = baseColor[2] + Math.floor(Math.random() * (variation * 2 + 1)) - variation;
        
        // Ensure values are within valid RGB range (0-255)
        red = Math.max(0, Math.min(255, red));
        green = Math.max(0, Math.min(255, green));
        blue = Math.max(0, Math.min(255, blue));
        
        // Construct the color string in hexadecimal format
        let color = '#' + red.toString(16).padStart(2, '0') +
                            green.toString(16).padStart(2, '0') +
                            blue.toString(16).padStart(2, '0');
        
        // Check if this color is sufficiently different from existing colors
        let isUnique = true;
        for (const existingColor of existingColors) {
            if (colorDistance(color, existingColor) < minDistance) {
                isUnique = false;
                break;
            }
        }
        
        if (isUnique) {
            return color;
        }
    }
    
    // Fallback: if we can't find a unique color after maxAttempts, return a random color anyway
    console.warn('Could not generate sufficiently unique color, using fallback');
    const baseColor = [0x6c, 0xcc, 0x86];
    let variation = 70;
    
    let red = baseColor[0] + Math.floor(Math.random() * (variation * 2 + 1)) - variation;
    let green = baseColor[1] + Math.floor(Math.random() * (variation * 2 + 1)) - variation;
    let blue = baseColor[2] + Math.floor(Math.random() * (variation * 2 + 1)) - variation;
    
    red = Math.max(0, Math.min(255, red));
    green = Math.max(0, Math.min(255, green));
    blue = Math.max(0, Math.min(255, blue));
    
    return '#' + red.toString(16).padStart(2, '0') +
                 green.toString(16).padStart(2, '0') +
                 blue.toString(16).padStart(2, '0');
}

function exportToGoogleCalendar() {
    // Hide the dropdown
    const options = document.getElementById('export-options');
    if (options) {
        options.classList.remove('show');
    }
    
    if (subjects.length === 0) {
        alert('No subjects to export. Please add subjects first.');
        return;
    }

    // Generate the current timetable
    const timetable = generate_timetable();
    
    if (Object.keys(timetable).length === 0) {
        alert('No timetable generated. Please generate a timetable first.');
        return;
    }

    // Create iCalendar content
    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Timetable Maker//Timetable Export//EN\r\nCALSCALE:GREGORIAN\r\n`;

    // Add events from the timetable
    Object.entries(timetable).forEach(([dateString, eventData]) => {
        const eventDate = new Date(dateString);
        const formattedDate = eventDate.toISOString().slice(0, 10).replace(/-/g, '');
        
        // Handle array of events (Sunday with multiple slots)
        if (Array.isArray(eventData)) {
            eventData.forEach((eventText, index) => {
                processEventForExport(eventText, formattedDate, index);
            });
        } else {
            // Handle single event (string)
            processEventForExport(eventData, formattedDate, 0);
        }
    });

    // Helper function to process individual events
    function processEventForExport(eventText, formattedDate, eventIndex) {
        // Handle combined events (Exam: A, Study: B) by creating separate events
        if (eventText.includes('Exam:') && eventText.includes('Study:')) {
            const parts = eventText.split(', ');
            const examPart = parts[0]; // "Exam: SubjectA"
            const studyPart = parts[1]; // "Study: SubjectB"
            
            // Create exam event
            const examSubject = examPart.split(': ')[1];
            const examUid = `${formattedDate}-Exam-${examSubject.replace(/\s+/g, '')}-${Date.now()}-${eventIndex}@timetablemaker.com`;
            
            icsContent += `BEGIN:VEVENT\r\n`;
            icsContent += `UID:${examUid}\r\n`;
            icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
            icsContent += `DTSTART:${formattedDate}T100000\r\n`;
            icsContent += `DTEND:${formattedDate}T130000\r\n`;
            icsContent += `SUMMARY:${examPart}\r\n`;
            icsContent += `DESCRIPTION:Exam for ${examSubject}\r\n`;
            icsContent += `CATEGORIES:Exam\r\n`;
            icsContent += `END:VEVENT\r\n`;
            
            // Create study event
            const studySubject = studyPart.split(': ')[1];
            const studyUid = `${formattedDate}-Study-${studySubject.replace(/\s+/g, '')}-${Date.now() + 1}-${eventIndex}@timetablemaker.com`;
            
            icsContent += `BEGIN:VEVENT\r\n`;
            icsContent += `UID:${studyUid}\r\n`;
            icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
            icsContent += `DTSTART:${formattedDate}T140000\r\n`;
            icsContent += `DTEND:${formattedDate}T160000\r\n`;
            icsContent += `SUMMARY:${studyPart}\r\n`;
            icsContent += `DESCRIPTION:Study session for ${studySubject}\r\n`;
            icsContent += `CATEGORIES:Study\r\n`;
            icsContent += `END:VEVENT\r\n`;
        } else {
            // Handle single events
            const [eventType, subjectName] = eventText.split(': ');
            
            // Create unique ID for the event
            const uid = `${formattedDate}-${eventType}-${subjectName.replace(/\s+/g, '')}-${Date.now()}-${eventIndex}@timetablemaker.com`;
            
            // Set event duration (2 hours for study, 3 hours for exam)
            const startTime = eventType === 'Study' ? '090000' : '100000'; // 9 AM for study, 10 AM for exam
            const endTime = eventType === 'Study' ? '110000' : '130000';   // 11 AM for study, 1 PM for exam
            
            icsContent += `BEGIN:VEVENT\r\n`;
            icsContent += `UID:${uid}\r\n`;
            icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
            icsContent += `DTSTART:${formattedDate}T${startTime}\r\n`;
            icsContent += `DTEND:${formattedDate}T${endTime}\r\n`;
            icsContent += `SUMMARY:${eventText}\r\n`;
            
            if (eventType === 'Study') {
                icsContent += `DESCRIPTION:Study session for ${subjectName}\r\n`;
                icsContent += `CATEGORIES:Study\r\n`;
            } else {
                icsContent += `DESCRIPTION:Exam for ${subjectName}\r\n`;
                icsContent += `CATEGORIES:Exam\r\n`;
            }
            
            icsContent += `END:VEVENT\r\n`;
        }
    }

    icsContent += `END:VCALENDAR\r\n`;

    // Create and trigger download
    try {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'study-timetable.ics';
        
        // Append to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(url);
        
        alert('Timetable exported successfully! Import the downloaded .ics file into Google Calendar.');
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    }
}

// Export dropdown functionality
function toggleExportDropdown() {
    const options = document.getElementById('export-options');
    if (options) {
        options.classList.toggle('show');
    }
}

// Placeholder function for PDF export
function printAsPDF() {
    // Hide the dropdown after clicking
    const options = document.getElementById('export-options');
    if (options) {
        options.classList.remove('show');
    }
    
    if (subjects.length === 0) {
        alert('No subjects to export. Please add subjects and generate a timetable first.');
        return;
    }

    // Generate the current timetable
    const timetable = generate_timetable();
    
    if (Object.keys(timetable).length === 0) {
        alert('No timetable generated. Please generate a timetable first.');
        return;
    }
    
    generatePDF(timetable);
}

function generatePDF(timetable) {
    // Get all dates in the timetable to determine the range
    const allDates = Object.keys(timetable).map(date => new Date(date));
    if (allDates.length === 0) {
        alert('No events to export.');
        return;
    }
    
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    
    // Generate all months between min and max date
    const monthsToRender = [];
    const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    
    while (currentDate <= endDate) {
        monthsToRender.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Load template and generate PDF
    loadPDFTemplate().then(template => {
        // Convert logo to base64 for embedding
        convertLogoToBase64().then(logoDataUrl => {
            generatePDFWithTemplate(template, monthsToRender, timetable, logoDataUrl);
        }).catch(error => {
            console.error('Error loading logo:', error);
            // Generate PDF without logo if there's an error
            generatePDFWithTemplate(template, monthsToRender, timetable, null);
        });
    }).catch(error => {
        console.error('Error loading PDF template:', error);
        alert('Error loading PDF template. Please try again.');
    });
}

function loadPDFTemplate() {
    return fetch('pdf_template.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load PDF template');
            }
            return response.text();
        });
}

function convertLogoToBase64() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            try {
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = reject;
        img.src = 'logo.png';
    });
}

function generatePDFWithTemplate(template, monthsToRender, timetable, logoDataUrl) {
    // Replace placeholders in template
    let htmlContent = template;
    
    // Replace logo placeholder
    const logoHTML = logoDataUrl ? `<img src="${logoDataUrl}" alt="Plan Panther Logo" class="header-logo">` : '';
    htmlContent = htmlContent.replace('{{LOGO_PLACEHOLDER}}', logoHTML);
    
    // Replace date placeholder
    htmlContent = htmlContent.replace('{{DATE_PLACEHOLDER}}', new Date().toLocaleDateString());
    
    // Generate calendar content
    let calendarContent = '';
    monthsToRender.forEach((monthDate, index) => {
        calendarContent += generateMonthHTML(monthDate, timetable);
    });
    htmlContent = htmlContent.replace('{{CALENDAR_CONTENT}}', calendarContent);
    
    // Replace legend and subjects content
    htmlContent = htmlContent.replace('{{LEGEND_CONTENT}}', generateLegendHTML());
    htmlContent = htmlContent.replace('{{SUBJECTS_CONTENT}}', generateSubjectsListHTML());
    
    // Create a new window for PDF content
    const printWindow = window.open('', '_blank');
    
    // Write content to the new window
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
}

function generateMonthHTML(monthDate, timetable) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const startDay = startOfMonth.getUTCDay();
    const daysInMonth = endOfMonth.getDate();
    
    let html = `
        <div class="month-container">
            <div class="month-title">${monthNames[month]} ${year}</div>
            <div class="calendar-grid">
                <div class="day-header">Sun</div>
                <div class="day-header">Mon</div>
                <div class="day-header">Tue</div>
                <div class="day-header">Wed</div>
                <div class="day-header">Thu</div>
                <div class="day-header">Fri</div>
                <div class="day-header">Sat</div>
    `;
    
    // Add overflow days from previous month
    const prevMonth = new Date(year, month - 1, 1);
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, daysInPrevMonth - i);
        const dateString = date.toISOString().split('T')[0];
        html += generateDayHTML(date.getDate(), dateString, timetable, true);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        html += generateDayHTML(day, dateString, timetable, false);
    }
    
    // Add overflow days from next month
    const totalCells = startDay + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) {
        for (let i = 1; i <= remainingCells; i++) {
            const date = new Date(year, month + 1, i);
            const dateString = date.toISOString().split('T')[0];
            html += generateDayHTML(i, dateString, timetable, true);
        }
    }
    
    html += '</div></div>';
    return html;
}

function generateDayHTML(dayNumber, dateString, timetable, isOverflow) {
    const date = new Date(dateString);
    const isSunday = date.getUTCDay() === 0;
    const isBusy = DaysWhenBusy.includes(dateString);
    
    let dayClass = 'calendar-day';
    if (isOverflow) dayClass += ' overflow';
    if (isSunday) dayClass += ' sunday';
    if (isBusy) dayClass += ' busy';
    
    let html = `<div class="${dayClass}">`;
    html += `<div class="day-number">${dayNumber}</div>`;
    
    // Add events for this day
    if (timetable[dateString]) {
        const eventData = timetable[dateString];
        
        if (Array.isArray(eventData)) {
            eventData.forEach(eventText => {
                html += generateEventHTML(eventText);
            });
        } else {
            html += generateEventHTML(eventData);
        }
    }
    
    // Add busy indicator
    if (isBusy) {
        html += '<div class="busy-indicator">●</div>';
    }
    
    html += '</div>';
    return html;
}

function generateEventHTML(eventText) {
    if (eventText.includes('Exam:') && eventText.includes('Study:')) {
        // Combined event
        const parts = eventText.split(', ');
        let html = '';
        parts.forEach(part => {
            if (part.startsWith('Exam:')) {
                html += `<div class="calendar-event exam-event" style="background-color: #FF0000 !important; border: 2px solid #CC0000; -webkit-print-color-adjust: exact; color-adjust: exact; print-color-adjust: exact;">${part}</div>`;
            } else if (part.startsWith('Study:')) {
                const subjectName = part.split(': ')[1].split(' (')[0];
                const subject = subjects.find(s => s.name === subjectName);
                const backgroundColor = subject ? subject.color : '#407CFF';
                html += `<div class="calendar-event study-event" style="background-color: ${backgroundColor} !important; border: 2px solid ${backgroundColor}; -webkit-print-color-adjust: exact; color-adjust: exact; print-color-adjust: exact;">${part}</div>`;
            }
        });
        return html;
    } else if (eventText.startsWith('Exam:')) {
        return `<div class="calendar-event exam-event" style="background-color: #FF0000 !important; border: 2px solid #CC0000; -webkit-print-color-adjust: exact; color-adjust: exact; print-color-adjust: exact;">${eventText}</div>`;
    } else if (eventText.startsWith('Study:')) {
        // Try to match subject color
        const subjectName = eventText.split(': ')[1].split(' (')[0];
        const subject = subjects.find(s => s.name === subjectName);
        const backgroundColor = subject ? subject.color : '#407CFF';
        return `<div class="calendar-event study-event" style="background-color: ${backgroundColor} !important; border: 2px solid ${backgroundColor}; -webkit-print-color-adjust: exact; color-adjust: exact; print-color-adjust: exact;">${eventText}</div>`;
    }
    return '';
}

function generateLegendHTML() {
    return `
        <div class="legend">
            <h3>Legend</h3>
            <div class="legend-item">
                <span class="legend-color exam-event"></span>
                Exam Days
            </div>
            <div class="legend-item">
                <span class="legend-color study-event"></span>
                Study Sessions
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background-color: #fff3cd;"></span>
                Busy Days
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background-color: #fff5f5;"></span>
                Sundays
            </div>
        </div>
    `;
}

function generateSubjectsListHTML() {
    let html = `
        <div class="subjects-list">
            <h3>Subjects</h3>
    `;
    
    subjects.forEach((subject, index) => {
        // Convert stored difficulty (1-3) to correct text
        let difficultyText = 'Easy'; // Default
        if (subject.difficulty === 2) {
            difficultyText = 'Medium';
        } else if (subject.difficulty === 3) {
            difficultyText = 'Hard';
        }
        
        html += `
            <div class="subject-item" style="border-left-color: ${subject.color};">
                <strong>${index + 1}. ${subject.name}</strong><br>
                Exam Date: ${subject.date} | Difficulty: ${difficultyText}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Mark busy days functionality
function toggle_mark_busy_mode() {
    markBusyMode = !markBusyMode;
    const button = document.getElementById('mark_busy_button_bar');
    
    if (markBusyMode) {
        button.textContent = 'Click days to mark as busy (Click here to exit)';
        button.classList.add('active');
        // Add visual indication that we're in mark busy mode
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
            day.style.cursor = 'crosshair';
        });
    } else {
        button.textContent = 'Mark days when you are not free';
        button.classList.remove('active');
        // Reset cursor for calendar days
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
            day.style.cursor = 'pointer';
        });
    }
}

function toggleBusyDay(dayElement) {
    const date = dayElement.dataset.date;
    const index = DaysWhenBusy.indexOf(date);
    
    if (index === -1) {
        // Day is not busy, mark it as busy
        DaysWhenBusy.push(date);
        dayElement.classList.add('busy');
        console.log(`Marked ${date} as busy`);
    } else {
        // Day is busy, remove it from busy days
        DaysWhenBusy.splice(index, 1);
        dayElement.classList.remove('busy');
        console.log(`Removed ${date} from busy days`);
    }
    
    // Save busy days to localStorage
    saveToLocalStorage();
    
    console.log('All busy days:', DaysWhenBusy); // Debug log
}
