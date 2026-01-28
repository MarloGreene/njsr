// Canvas setup
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('loading');
const versePopup = document.getElementById('versePopup');
const verseReference = document.getElementById('verseReference');
const verseText = document.getElementById('verseText');
const closeBtn = document.getElementById('closeBtn');
const toggleBtn = document.getElementById('toggleBtn');
const speedSlider = document.getElementById('speedSlider');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load verses from pogp.txt
let verses = [];
let isLoaded = false;

// Fetch and parse verses
async function loadVerses() {
    try {
        const response = await fetch('pogp.txt');
        if (!response.ok) {
            throw new Error('Could not load pogp.txt');
        }
        const text = await response.text();
        verses = text.split('\n').filter(line => line.trim().length > 0);
        
        if (verses.length === 0) {
            throw new Error('No verses found in pogp.txt');
        }
        
        isLoaded = true;
        loading.style.display = 'none';
        initializeColumns();
        animate();
    } catch (error) {
        loading.textContent = 'Error: Please add pogp.txt file with verses (one per line, format: "Book Chapter:Verse Text")';
        console.error('Error loading verses:', error);
    }
}

// Parse verse to get reference and text
function parseVerse(verse) {
    // Expected format: "Book Chapter:Verse Text of the verse"
    const match = verse.match(/^([A-Za-z0-9\s—-]+ \d+:\d+)\s+(.+)$/);
    if (match) {
        return {
            reference: match[1].trim(),
            text: match[2].trim()
        };
    }
    return {
        reference: 'Unknown',
        text: verse
    };
}

// Column configuration
const fontSize = 16;
const columns = Math.floor(canvas.width / fontSize);
const columnData = [];

// Initialize columns
function initializeColumns() {
    for (let i = 0; i < columns; i++) {
        const verseIndex = Math.floor(Math.random() * verses.length);
        const verse = verses[verseIndex];
        
        columnData.push({
            verseIndex: verseIndex,
            verseText: verse, // Full verse text
            charIndex: 0, // Current character position in verse
            y: Math.random() * canvas.height, // Current y position on screen
            opacity: 0.4 + Math.random() * 0.6, // Random opacity for variety
            colorShift: Math.random() * 20 - 10 // Subtle color variation for iridescence
        });
    }
}

// Animation state
let isRunning = true;
let speed = parseInt(localStorage.getItem('pogpMatrixSpeed')) || 50;
speedSlider.value = speed;

// Draw function
function draw() {
    // Semi-transparent black to create fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = fontSize + 'px monospace';
    
    // Draw each column
    columnData.forEach((col, i) => {
        // Get current character
        const char = col.verseText[col.charIndex] || ' ';
        
        // Pearly color with subtle iridescence (slight color variations)
        const r = Math.min(255, 250 + col.colorShift);
        const g = Math.min(255, 240 + col.colorShift);
        const b = Math.min(255, 230 + col.colorShift);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${col.opacity})`;
        
        // Add subtle text shadow for glow
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
        ctx.shadowBlur = 3;
        
        // Draw character
        ctx.fillText(char, i * fontSize, col.y);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Move to next character
        col.charIndex++;
        
        // Reset if we've finished the verse or gone off screen
        if (col.charIndex >= col.verseText.length || col.y > canvas.height) {
            // Get new random verse
            col.verseIndex = Math.floor(Math.random() * verses.length);
            col.verseText = verses[col.verseIndex];
            col.charIndex = 0;
            col.y = 0;
            col.opacity = 0.4 + Math.random() * 0.6;
            col.colorShift = Math.random() * 20 - 10;
        } else {
            // Move down
            col.y += fontSize;
        }
    });
}

// Animation loop
let animationId;
function animate() {
    if (isRunning && isLoaded) {
        draw();
        animationId = setTimeout(() => {
            requestAnimationFrame(animate);
        }, 100 - speed);
    }
}

// Handle canvas click
canvas.addEventListener('click', (e) => {
    if (!isLoaded) return;
    
    // Find which column was clicked
    const colIndex = Math.floor(e.clientX / fontSize);
    if (colIndex >= 0 && colIndex < columnData.length) {
        const verse = verses[columnData[colIndex].verseIndex];
        const parsed = parseVerse(verse);
        
        // Show popup
        verseReference.textContent = parsed.reference;
        verseText.textContent = parsed.text;
        versePopup.classList.add('show');
    }
});

// Close popup
function closePopup() {
    versePopup.classList.remove('show');
}

closeBtn.addEventListener('click', closePopup);
versePopup.addEventListener('click', (e) => {
    if (e.target === versePopup) {
        closePopup();
    }
});

// Escape key to close popup
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePopup();
    }
});

// Controls
toggleBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    toggleBtn.textContent = isRunning ? 'Pause' : 'Resume';
    if (isRunning) {
        animate();
    }
});

speedSlider.addEventListener('input', (e) => {
    speed = parseInt(e.target.value);
    localStorage.setItem('pogpMatrixSpeed', speed);
});

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Start loading verses
loadVerses();
