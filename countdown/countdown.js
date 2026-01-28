// Elements
const eventNameInput = document.getElementById('eventName');
const targetDateInput = document.getElementById('targetDate');
const setBtn = document.getElementById('setBtn');
const displayEventName = document.getElementById('displayEventName');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const completeMessage = document.getElementById('completeMessage');

let targetDate = null;
let countdownInterval = null;

// Load saved countdown or use default
const savedEvent = localStorage.getItem('countdownEvent');
const savedDate = localStorage.getItem('countdownDate');

if (savedEvent && savedDate) {
    eventNameInput.value = savedEvent;
    targetDateInput.value = savedDate;
} else {
    // Set default date to New Year 2027
    const defaultDate = new Date('2027-01-01T00:00:00');
    targetDateInput.value = defaultDate.toISOString().slice(0, 16);
    eventNameInput.value = 'New Year 2027';
}

// Update countdown display
function updateCountdown() {
    if (!targetDate) return;
    
    const now = new Date().getTime();
    const distance = targetDate - now;
    
    if (distance < 0) {
        // Countdown complete
        clearInterval(countdownInterval);
        daysEl.textContent = '0';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        completeMessage.classList.add('show');
        return;
    }
    
    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Update display
    daysEl.textContent = days;
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
    completeMessage.classList.remove('show');
}

// Set countdown
function setCountdown() {
    const eventName = eventNameInput.value.trim() || 'Event';
    const dateValue = targetDateInput.value;
    
    if (!dateValue) {
        alert('Please select a date and time');
        return;
    }
    
    targetDate = new Date(dateValue).getTime();
    displayEventName.textContent = eventName;
    
    // Save to localStorage
    localStorage.setItem('countdownEvent', eventName);
    localStorage.setItem('countdownDate', dateValue);
    
    // Clear existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // Update immediately and then every second
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// Event listeners
setBtn.addEventListener('click', setCountdown);

// Allow Enter key to set countdown
eventNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setCountdown();
});

targetDateInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setCountdown();
});

// Initialize with default countdown
setCountdown();
