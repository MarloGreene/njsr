// Elements
const bpmDisplay = document.getElementById('bpmDisplay');
const bpmSlider = document.getElementById('bpmSlider');
const startStopBtn = document.getElementById('startStopBtn');
const visualBeat = document.getElementById('visualBeat');
const presetBtns = document.querySelectorAll('.preset-btn');
const timeSigBtns = document.querySelectorAll('.time-sig-btn');
const beatIndicator = document.getElementById('beatIndicator');

// Audio context for tick sound
let audioContext;
let isRunning = false;
let intervalId = null;
let currentBPM = parseInt(localStorage.getItem('metronomeBPM')) || 120;
let beatsPerMeasure = parseInt(localStorage.getItem('metronomeBeats')) || 4;
let subdivision = parseInt(localStorage.getItem('metronomeSubdivision')) || 4;
let currentBeat = 1;

// Initialize audio context on first user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Create a tick sound using Web Audio API
function playTick(isDownbeat = false) {
    initAudio();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Higher pitch for downbeat
    oscillator.frequency.value = isDownbeat ? 1200 : 800;
    oscillator.type = 'sine';

    // Louder for downbeat
    const volume = isDownbeat ? 0.4 : 0.25;
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);

    // Visual pulse
    visualBeat.classList.add('pulse');
    setTimeout(() => {
        visualBeat.classList.remove('pulse');
    }, 100);

    // Update beat indicator
    updateBeatIndicator();
}

// Update beat indicator display
function updateBeatIndicator() {
    const dots = beatIndicator.querySelectorAll('.beat-dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('active', 'downbeat');
        if (index + 1 === currentBeat) {
            dot.classList.add('active');
            if (currentBeat === 1) {
                dot.classList.add('downbeat');
            }
        }
    });
}

// Build beat indicator dots
function buildBeatIndicator() {
    beatIndicator.innerHTML = '';
    for (let i = 1; i <= beatsPerMeasure; i++) {
        const dot = document.createElement('span');
        dot.className = 'beat-dot' + (i === 1 ? ' active' : '');
        dot.dataset.beat = i;
        dot.textContent = i;
        beatIndicator.appendChild(dot);
    }
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

// Initialize time signature
function initTimeSignature() {
    // Set active button based on saved values
    timeSigBtns.forEach(btn => {
        const beats = parseInt(btn.dataset.beats);
        const sub = parseInt(btn.dataset.subdivision);
        if (beats === beatsPerMeasure && sub === subdivision) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    buildBeatIndicator();
}

// Start metronome
function start() {
    initAudio();
    isRunning = true;
    currentBeat = 1;
    startStopBtn.textContent = 'Stop';
    startStopBtn.classList.add('running');

    const interval = 60000 / currentBPM; // milliseconds per beat

    playTick(true); // First tick is downbeat
    intervalId = setInterval(() => {
        currentBeat++;
        if (currentBeat > beatsPerMeasure) {
            currentBeat = 1;
        }
        playTick(currentBeat === 1);
    }, interval);
}

// Stop metronome
function stop() {
    isRunning = false;
    currentBeat = 1;
    startStopBtn.textContent = 'Start';
    startStopBtn.classList.remove('running');

    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    // Reset beat indicator
    updateBeatIndicator();
}

// Toggle start/stop
function toggleMetronome() {
    if (isRunning) {
        stop();
    } else {
        start();
    }
}

// Set time signature
function setTimeSignature(beats, sub) {
    beatsPerMeasure = beats;
    subdivision = sub;
    localStorage.setItem('metronomeBeats', beats);
    localStorage.setItem('metronomeSubdivision', sub);

    // Update button states
    timeSigBtns.forEach(btn => {
        const btnBeats = parseInt(btn.dataset.beats);
        const btnSub = parseInt(btn.dataset.subdivision);
        if (btnBeats === beats && btnSub === sub) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Rebuild beat indicator
    buildBeatIndicator();

    // Reset current beat
    currentBeat = 1;

    // Restart if running
    if (isRunning) {
        stop();
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

timeSigBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const beats = parseInt(btn.dataset.beats);
        const sub = parseInt(btn.dataset.subdivision);
        setTimeSignature(beats, sub);
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

// Initialize
initTimeSignature();
