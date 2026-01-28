// Elements
const timeDisplay = document.getElementById('timeDisplay');
const startStopBtn = document.getElementById('startStopBtn');
const splitBtn = document.getElementById('splitBtn');
const resetBtn = document.getElementById('resetBtn');
const splitsList = document.getElementById('splitsList');

// State
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let splits;
try {
    splits = JSON.parse(localStorage.getItem('stopwatchSplits')) || [];
} catch (e) {
    console.error('Failed to parse stopwatchSplits:', e);
    splits = [];
}

// Format time as HH:MM:SS.mm
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
}

// Update display
function updateDisplay() {
    const currentTime = Date.now();
    elapsedTime = currentTime - startTime;
    timeDisplay.textContent = formatTime(elapsedTime);
}

// Start/Stop functionality
function toggleStartStop() {
    if (!isRunning) {
        // Start
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateDisplay, 10);
        isRunning = true;
        startStopBtn.textContent = 'Stop';
        startStopBtn.classList.add('running');
        splitBtn.disabled = false;
    } else {
        // Stop
        clearInterval(timerInterval);
        isRunning = false;
        startStopBtn.textContent = 'Start';
        startStopBtn.classList.remove('running');
        splitBtn.disabled = true;
    }
}

// Reset functionality
function reset() {
    // Ask for confirmation if there's any elapsed time or splits
    if (elapsedTime > 0 || splits.length > 0) {
        if (!confirm('Are you sure you want to reset? All data will be lost.')) {
            return;
        }
    }
    
    clearInterval(timerInterval);
    isRunning = false;
    startTime = 0;
    elapsedTime = 0;
    splits = [];
    localStorage.removeItem('stopwatchSplits');
    timeDisplay.textContent = '00:00:00.00';
    startStopBtn.textContent = 'Start';
    startStopBtn.classList.remove('running');
    splitBtn.disabled = true;
    renderSplits();
}

// Initialize - render any saved splits
renderSplits();

// Record split
function recordSplit() {
    if (!isRunning) return;
    
    splits.push(elapsedTime);
    localStorage.setItem('stopwatchSplits', JSON.stringify(splits));
    renderSplits();
}

// Render splits list
function renderSplits() {
    if (splits.length === 0) {
        splitsList.innerHTML = '<div class="empty-state">No splits recorded yet</div>';
        return;
    }
    
    splitsList.innerHTML = '';
    splits.forEach((splitTime, index) => {
        const splitItem = document.createElement('div');
        splitItem.className = 'split-item';
        
        const splitNumber = document.createElement('span');
        splitNumber.className = 'split-number';
        splitNumber.textContent = `Split ${index + 1}`;
        
        const splitTimeDisplay = document.createElement('span');
        splitTimeDisplay.className = 'split-time';
        splitTimeDisplay.textContent = formatTime(splitTime);
        
        // Calculate delta from previous split
        if (index > 0) {
            const delta = splitTime - splits[index - 1];
            const deltaSpan = document.createElement('span');
            deltaSpan.className = 'split-delta';
            deltaSpan.textContent = `(+${formatTime(delta)})`;
            splitTimeDisplay.appendChild(deltaSpan);
        }
        
        splitItem.appendChild(splitNumber);
        splitItem.appendChild(splitTimeDisplay);
        splitsList.appendChild(splitItem);
    });
}

// Event listeners
startStopBtn.addEventListener('click', toggleStartStop);
resetBtn.addEventListener('click', reset);
splitBtn.addEventListener('click', recordSplit);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        toggleStartStop();
    } else if (e.code === 'KeyS' && isRunning) {
        e.preventDefault();
        recordSplit();
    } else if (e.code === 'KeyR') {
        e.preventDefault();
        reset();
    }
});
