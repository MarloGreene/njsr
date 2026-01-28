// Get current date info
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();
const currentDay = today.getDate();

// Month names
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Day names
const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Set year title
document.getElementById('yearTitle').textContent = currentYear;

// Clock functionality
const clockEl = document.getElementById('clock');
const toastEl = document.getElementById('toast');

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2000);
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    clockEl.textContent = timeString;
}
updateClock();
setInterval(updateClock, 100); // Update every 100ms for milliseconds

clockEl.addEventListener('click', () => {
    const now = new Date();
    const timestamp = now.toISOString();
    navigator.clipboard.writeText(timestamp).then(() => {
        showToast('Timestamp copied to clipboard!');
    });
});

// Get days in month
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Get first day of month (0 = Sunday, 6 = Saturday)
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

// Create calendar for a single month
function createMonthCalendar(year, month) {
    const monthContainer = document.createElement('div');
    monthContainer.className = 'month-container';
    
    // Highlight current month
    if (month === currentMonth) {
        monthContainer.classList.add('current-month');
    }
    
    // Month name
    const monthNameEl = document.createElement('div');
    monthNameEl.className = 'month-name';
    monthNameEl.textContent = monthNames[month];
    monthContainer.appendChild(monthNameEl);
    
    // Calendar table
    const table = document.createElement('table');
    table.className = 'calendar-table';
    
    // Header row (day names)
    const headerRow = document.createElement('tr');
    dayNames.forEach(day => {
        const th = document.createElement('th');
        th.textContent = day;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Get month info
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Create calendar rows
    let dayCounter = 1;
    let currentRow = document.createElement('tr');
    
    // Fill in empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('td');
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'day empty';
        emptyDiv.textContent = '-';
        emptyCell.appendChild(emptyDiv);
        currentRow.appendChild(emptyCell);
    }
    
    // Fill in days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = (firstDay + day - 1) % 7;
        
        // Start new row on Sunday (except first row)
        if (dayOfWeek === 0 && day > 1) {
            table.appendChild(currentRow);
            currentRow = document.createElement('tr');
        }
        
        const dayCell = document.createElement('td');
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.textContent = day;
        
        // Highlight today
        if (month === currentMonth && day === currentDay) {
            dayDiv.classList.add('today');
        }
        
        // Highlight weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayDiv.classList.add('weekend');
        }
        
        // Make clickable to copy date
        dayDiv.addEventListener('click', () => {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
            navigator.clipboard.writeText(dateString).then(() => {
                showToast(`Date ${dateString} copied to clipboard!`);
            });
        });
        
        dayCell.appendChild(dayDiv);
        currentRow.appendChild(dayCell);
    }
    
    // Fill remaining cells in last row
    const remainingCells = 7 - currentRow.children.length;
    for (let i = 0; i < remainingCells; i++) {
        const emptyCell = document.createElement('td');
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'day empty';
        emptyDiv.textContent = '-';
        emptyCell.appendChild(emptyDiv);
        currentRow.appendChild(emptyCell);
    }
    
    table.appendChild(currentRow);
    monthContainer.appendChild(table);
    
    return monthContainer;
}

// Generate full year calendar
function generateYearCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    
    for (let month = 0; month < 12; month++) {
        const monthCalendar = createMonthCalendar(currentYear, month);
        calendarGrid.appendChild(monthCalendar);
    }
}

// Initialize
generateYearCalendar();
