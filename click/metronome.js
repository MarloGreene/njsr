// Elements
const bpmDisplay = document.getElementById('bpmDisplay');
const bpmSlider = document.getElementById('bpmSlider');
const startStopBtn = document.getElementById('startStopBtn');
const visualBeat = document.getElementById('visualBeat');
const presetBtns = document.querySelectorAll('.preset-btn');

// Audio context for tick sound
let audioContext;
let isRunning = false;
let intervalId = null;
let currentBPM = parseInt(localStorage.getItem('metronomeBPM')) || 120;

// Initialize audio context on first user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Create a tick sound using Web Audio API
function playTick() {
    initAudio();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
    
    // Visual pulse
    visualBeat.classList.add('pulse');
    setTimeout(() => {
        visualBeat.classList.remove('pulse');
    }, 100);
}

// Update BPM
function updateBPM(bpm) {
    currentBPM = bpm;
    bpmDisplay.textContent = bpm;
    localStorage.setItem('metronomeBPM', bpm);
    
    // Restart if running
    if (isRunning) {
        stop();
        start();
    }
}

// Initialize display with saved BPM
bpmDisplay.textContent = currentBPM;
bpmSlider.value = currentBPM;

// Start metronome
function start() {
    initAudio();
    isRunning = true;
    startStopBtn.textContent = 'Stop';
    startStopBtn.classList.add('running');
    
    const interval = 60000 / currentBPM; // milliseconds per beat
    
    playTick(); // First tick immediately
    intervalId = setInterval(playTick, interval);
}

// Stop metronome
function stop() {
    isRunning = false;
    startStopBtn.textContent = 'Start';
    startStopBtn.classList.remove('running');
    
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

// Toggle start/stop
function toggleMetronome() {
    if (isRunning) {
        stop();
    } else {
        start();
    }
}

// Event listeners
startStopBtn.addEventListener('click', toggleMetronome);

bpmSlider.addEventListener('input', (e) => {
    updateBPM(parseInt(e.target.value));
});

presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const bpm = parseInt(btn.dataset.bpm);
        bpmSlider.value = bpm;
        updateBPM(bpm);
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        toggleMetronome();
    } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newBPM = Math.min(240, currentBPM + 5);
        bpmSlider.value = newBPM;
        updateBPM(newBPM);
    } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newBPM = Math.max(40, currentBPM - 5);
        bpmSlider.value = newBPM;
        updateBPM(newBPM);
    }
});
