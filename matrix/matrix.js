// Canvas setup
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Matrix characters - katakana, latin letters, and numbers
const matrixChars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const chars = matrixChars.split('');

const fontSize = 16;
const columns = canvas.width / fontSize;

// Array of drops - one per column
const drops = [];
for (let i = 0; i < columns; i++) {
    drops[i] = Math.floor(Math.random() * canvas.height / fontSize);
}

// Animation state
let isRunning = true;
let speed = parseInt(localStorage.getItem('matrixSpeed')) || 50; // milliseconds between frames

// Initialize speed slider
document.getElementById('speedSlider').value = speed;

// Draw function
function draw() {
    // Semi-transparent black to create fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0f0'; // Green text
    ctx.font = fontSize + 'px monospace';
    
    // Loop through drops
    for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // Draw character
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        // Reset drop to top randomly after it crosses bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        
        // Move drop down
        drops[i]++;
    }
}

// Animation loop
let animationId;
function animate() {
    if (isRunning) {
        draw();
        animationId = setTimeout(() => {
            requestAnimationFrame(animate);
        }, 100 - speed);
    }
}

// Controls
const toggleBtn = document.getElementById('toggleBtn');
const speedSlider = document.getElementById('speedSlider');

toggleBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    toggleBtn.textContent = isRunning ? 'Pause' : 'Resume';
    if (isRunning) {
        animate();
    }
});

speedSlider.addEventListener('input', (e) => {
    speed = parseInt(e.target.value);
    localStorage.setItem('matrixSpeed', speed);
});

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Recalculate columns and reset drops
    const newColumns = canvas.width / fontSize;
    drops.length = 0;
    for (let i = 0; i < newColumns; i++) {
        drops[i] = Math.floor(Math.random() * canvas.height / fontSize);
    }
});

// Start animation
animate();
