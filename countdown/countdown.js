// Elements
const eventNameInput = document.getElementById('eventName');
const targetDateInput = document.getElementById('targetDate');
const setBtn = document.getElementById('setBtn');
const countdownsList = document.getElementById('countdownsList');
const notifyBtn = document.getElementById('notifyBtn');
const notifyIcon = document.getElementById('notifyIcon');
const notifyText = document.getElementById('notifyText');
const notifyStatus = document.getElementById('notifyStatus');

// State
let countdowns = [];
let intervals = {};
let notifiedCountdowns = new Set(); // Track which countdowns have already triggered notifications
let notificationsEnabled = false;

// Load saved countdowns
function loadCountdowns() {
    try {
        const saved = localStorage.getItem('countdowns');
        countdowns = saved ? JSON.parse(saved) : [];

        // Load notified countdowns
        const notified = localStorage.getItem('notifiedCountdowns');
        if (notified) {
            notifiedCountdowns = new Set(JSON.parse(notified));
        }
    } catch (e) {
        console.error('Failed to load countdowns:', e);
        countdowns = [];
    }
}

// Save countdowns
function saveCountdowns() {
    localStorage.setItem('countdowns', JSON.stringify(countdowns));
}

// Save notified countdowns
function saveNotifiedCountdowns() {
    localStorage.setItem('notifiedCountdowns', JSON.stringify([...notifiedCountdowns]));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add new countdown
function addCountdown() {
    const eventName = eventNameInput.value.trim() || 'Event';
    const dateValue = targetDateInput.value;

    if (!dateValue) {
        alert('Please select a date and time');
        return;
    }

    const countdown = {
        id: generateId(),
        name: eventName,
        targetDate: dateValue
    };

    countdowns.unshift(countdown);
    saveCountdowns();
    renderCountdowns();

    // Clear inputs
    eventNameInput.value = '';
    targetDateInput.value = '';
}

// Delete countdown
function deleteCountdown(id) {
    // Clear interval
    if (intervals[id]) {
        clearInterval(intervals[id]);
        delete intervals[id];
    }

    // Remove from notified set
    notifiedCountdowns.delete(id);
    saveNotifiedCountdowns();

    countdowns = countdowns.filter(c => c.id !== id);
    saveCountdowns();
    renderCountdowns();
}

// Check and send notification
function checkNotification(countdown) {
    if (!notificationsEnabled) return;
    if (notifiedCountdowns.has(countdown.id)) return;

    const targetDate = new Date(countdown.targetDate).getTime();
    const now = new Date().getTime();
    const distance = targetDate - now;

    // Trigger notification when countdown reaches zero (within 1 second)
    if (distance <= 0 && distance > -1000) {
        sendNotification(countdown);
        notifiedCountdowns.add(countdown.id);
        saveNotifiedCountdowns();
    }
}

// Send browser notification
function sendNotification(countdown) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notification = new Notification('Countdown Complete!', {
        body: `"${countdown.name}" has reached its target time!`,
        icon: '⏰',
        tag: countdown.id,
        requireInteraction: true
    });

    // Play a sound (if available)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQMIetXFnF4MAoq+rIMsAH+Zg2sZAIOIZlYqMmx4amNgdoaRjHxlRjEtQ1lqcmZUQjQ0RllodHdqWUg5NkJPV1xaT0M7OEJMUVVWUUpDQENITVFRTklGR0lMT09NSUZGR0pMTkxKR0dISUtLSkhGR0dJSkpJR0dHSElJSUhHR0dISUlIR0dHSElJSEdHR0hJSUhHR0dISElIR0dHSEhIR0dHR0hISEdHR0dISEhHR0dHSEhHR0dHR0hIR0dHR0dIR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0c=');
        audio.play().catch(() => {}); // Ignore errors
    } catch (e) {}

    notification.onclick = () => {
        window.focus();
        notification.close();
    };
}

// Update single countdown display
function updateCountdownDisplay(id) {
    const countdown = countdowns.find(c => c.id === id);
    if (!countdown) return;

    const element = document.getElementById(`countdown-${id}`);
    if (!element) return;

    const targetDate = new Date(countdown.targetDate).getTime();
    const now = new Date().getTime();
    const distance = targetDate - now;

    const daysEl = element.querySelector('.days');
    const hoursEl = element.querySelector('.hours');
    const minutesEl = element.querySelector('.minutes');
    const secondsEl = element.querySelector('.seconds');
    const completeEl = element.querySelector('.complete-message');

    // Use absolute value for calculation, track if counting up
    const isPast = distance < 0;
    const absDistance = Math.abs(distance);

    // Calculate time units
    const days = Math.floor(absDistance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDistance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDistance % (1000 * 60)) / 1000);

    daysEl.textContent = days;
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');

    // Toggle past/future styling
    if (isPast) {
        element.classList.add('counting-up');
        completeEl.textContent = 'Time since';
        completeEl.classList.add('show');
    } else {
        element.classList.remove('counting-up');
        completeEl.classList.remove('show');
    }

    // Check for notification
    checkNotification(countdown);
}

// Render all countdowns
function renderCountdowns() {
    // Clear all intervals
    Object.keys(intervals).forEach(id => {
        clearInterval(intervals[id]);
    });
    intervals = {};

    if (countdowns.length === 0) {
        countdownsList.innerHTML = '<div class="empty-state">No countdowns yet. Add one above!</div>';
        return;
    }

    countdownsList.innerHTML = countdowns.map(countdown => `
        <div class="countdown-item" id="countdown-${countdown.id}">
            <div class="countdown-header">
                <div class="event-info">
                    <div class="event-name">${escapeHtml(countdown.name)}</div>
                    <div class="event-date">${formatTargetDate(countdown.targetDate)}</div>
                </div>
                <div class="countdown-actions">
                    <button class="btn-edit" data-id="${countdown.id}" title="Edit">✎</button>
                    <button class="btn-delete" data-id="${countdown.id}" title="Delete">&times;</button>
                </div>
            </div>
            <div class="time-blocks">
                <div class="time-block">
                    <div class="time-value days">0</div>
                    <div class="time-label">Days</div>
                </div>
                <div class="time-block">
                    <div class="time-value hours">00</div>
                    <div class="time-label">Hours</div>
                </div>
                <div class="time-block">
                    <div class="time-value minutes">00</div>
                    <div class="time-label">Minutes</div>
                </div>
                <div class="time-block">
                    <div class="time-value seconds">00</div>
                    <div class="time-label">Seconds</div>
                </div>
            </div>
            <div class="complete-message">Time's up!</div>
        </div>
    `).join('');

    // Add edit listeners
    countdownsList.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            editCountdown(btn.dataset.id);
        });
    });

    // Add delete listeners
    countdownsList.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteCountdown(btn.dataset.id);
        });
    });

    // Start intervals for each countdown
    countdowns.forEach(countdown => {
        updateCountdownDisplay(countdown.id);
        intervals[countdown.id] = setInterval(() => {
            updateCountdownDisplay(countdown.id);
        }, 1000);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format target date for display
function formatTargetDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Edit countdown
function editCountdown(id) {
    const countdown = countdowns.find(c => c.id === id);
    if (!countdown) return;

    const element = document.getElementById(`countdown-${id}`);
    if (!element) return;

    // Replace the header with edit form
    const header = element.querySelector('.countdown-header');
    const originalHTML = header.innerHTML;

    header.innerHTML = `
        <div class="edit-form">
            <input type="text" class="input edit-name" value="${escapeHtml(countdown.name)}" placeholder="Event name">
            <input type="datetime-local" class="input edit-date" value="${countdown.targetDate}">
            <div class="edit-actions">
                <button class="btn-save" data-id="${id}">Save</button>
                <button class="btn-cancel" data-id="${id}">Cancel</button>
            </div>
        </div>
    `;

    // Focus the name input
    header.querySelector('.edit-name').focus();

    // Save handler
    header.querySelector('.btn-save').addEventListener('click', () => {
        const newName = header.querySelector('.edit-name').value.trim() || 'Event';
        const newDate = header.querySelector('.edit-date').value;

        if (!newDate) {
            alert('Please select a date and time');
            return;
        }

        countdown.name = newName;
        countdown.targetDate = newDate;

        // Reset notification for this countdown if date changed
        notifiedCountdowns.delete(id);
        saveNotifiedCountdowns();

        saveCountdowns();
        renderCountdowns();
    });

    // Cancel handler
    header.querySelector('.btn-cancel').addEventListener('click', () => {
        renderCountdowns();
    });

    // Enter key saves, Escape cancels
    header.querySelectorAll('.input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                header.querySelector('.btn-save').click();
            } else if (e.key === 'Escape') {
                header.querySelector('.btn-cancel').click();
            }
        });
    });
}

// Notification functions
function initNotifications() {
    if (!('Notification' in window)) {
        notifyBtn.style.display = 'none';
        notifyStatus.textContent = 'Notifications not supported';
        return;
    }

    updateNotificationUI();
}

function updateNotificationUI() {
    const permission = Notification.permission;

    if (permission === 'granted') {
        notificationsEnabled = true;
        notifyBtn.classList.add('enabled');
        notifyIcon.textContent = '🔔';
        notifyText.textContent = 'Notifications On';
        notifyStatus.textContent = 'You\'ll be notified when countdowns complete';
    } else if (permission === 'denied') {
        notificationsEnabled = false;
        notifyBtn.classList.remove('enabled');
        notifyIcon.textContent = '🔕';
        notifyText.textContent = 'Notifications Blocked';
        notifyStatus.textContent = 'Enable in browser settings';
    } else {
        notificationsEnabled = false;
        notifyBtn.classList.remove('enabled');
        notifyIcon.textContent = '🔔';
        notifyText.textContent = 'Enable Notifications';
        notifyStatus.textContent = '';
    }
}

function toggleNotifications() {
    if (!('Notification' in window)) {
        alert('Your browser does not support notifications.');
        return;
    }

    if (Notification.permission === 'granted') {
        // Can't revoke, but we can toggle our internal state
        notificationsEnabled = !notificationsEnabled;
        if (notificationsEnabled) {
            notifyBtn.classList.add('enabled');
            notifyIcon.textContent = '🔔';
            notifyText.textContent = 'Notifications On';
            notifyStatus.textContent = 'You\'ll be notified when countdowns complete';
        } else {
            notifyBtn.classList.remove('enabled');
            notifyIcon.textContent = '🔕';
            notifyText.textContent = 'Notifications Off';
            notifyStatus.textContent = 'Click to re-enable';
        }
    } else if (Notification.permission === 'denied') {
        alert('Notifications are blocked. Please enable them in your browser settings.');
    } else {
        // Request permission
        Notification.requestPermission().then(permission => {
            updateNotificationUI();
        });
    }
}

// Event listeners
setBtn.addEventListener('click', addCountdown);
notifyBtn.addEventListener('click', toggleNotifications);

eventNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCountdown();
});

targetDateInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCountdown();
});

// Initialize
loadCountdowns();
initNotifications();

// Migrate old single countdown if exists
const oldEvent = localStorage.getItem('countdownEvent');
const oldDate = localStorage.getItem('countdownDate');
if (oldEvent && oldDate && countdowns.length === 0) {
    countdowns.push({
        id: generateId(),
        name: oldEvent,
        targetDate: oldDate
    });
    saveCountdowns();
    localStorage.removeItem('countdownEvent');
    localStorage.removeItem('countdownDate');
}

renderCountdowns();
