// Canvas and UI elements
const canvas = document.getElementById('saturationCanvas');
const ctx = canvas.getContext('2d');
const cursor = document.getElementById('satCursor');
const hueSlider = document.getElementById('hueSlider');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');
const colorPreview = document.getElementById('colorPreview');
const hexInput = document.getElementById('hexInput');
const rInput = document.getElementById('rInput');
const gInput = document.getElementById('gInput');
const bInput = document.getElementById('bInput');
const hInput = document.getElementById('hInput');
const sInput = document.getElementById('sInput');
const lInput = document.getElementById('lInput');
const eyeDropperBtn = document.getElementById('eyeDropper');
const swatchGrid = document.getElementById('swatchGrid');
const clearHistoryBtn = document.getElementById('clearHistory');

// State
let currentHue = 220;
let currentSat = 100;
let currentLight = 50;
let currentOpacity = 100;
let colorHistory;
try {
    colorHistory = JSON.parse(localStorage.getItem('colorHistory')) || [];
} catch (e) {
    console.error('Failed to parse colorHistory:', e);
    colorHistory = [];
}

// Draw saturation/lightness canvas
function drawSaturationCanvas() {
    const width = canvas.width;
    const height = canvas.height;
    
    // Base color from hue
    ctx.fillStyle = `hsl(${currentHue}, 100%, 50%)`;
    ctx.fillRect(0, 0, width, height);
    
    // White gradient (left to right)
    const whiteGrad = ctx.createLinearGradient(0, 0, width, 0);
    whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, width, height);
    
    // Black gradient (top to bottom)
    const blackGrad = ctx.createLinearGradient(0, 0, 0, height);
    blackGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    blackGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, width, height);
}

// Update cursor position on canvas
function updateCursorPosition() {
    const x = ((100 - currentSat) / 100) * canvas.offsetWidth;
    const y = ((100 - currentLight) / 100) * canvas.offsetHeight;
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
}

// Update all color displays
function updateColor() {
    // Update canvas
    drawSaturationCanvas();
    updateCursorPosition();
    
    // Get RGB from HSL
    const rgb = hslToRgb(currentHue, currentSat, currentLight);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentOpacity / 100})`;
    
    // Update preview
    colorPreview.style.background = rgba;
    
    // Update opacity slider overlay
    const opacityTrack = document.querySelector('.opacity-slider');
    opacityTrack.style.background = `
        linear-gradient(to right, transparent, ${hex}),
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%)
    `;
    opacityTrack.style.backgroundSize = '100%, 10px 10px, 10px 10px, 10px 10px, 10px 10px';
    opacityTrack.style.backgroundPosition = '0 0, 0 0, 0 5px, 5px -5px, -5px 0px';
    
    // Update inputs
    hexInput.value = hex.toUpperCase();
    rInput.value = rgb.r;
    gInput.value = rgb.g;
    bInput.value = rgb.b;
    hInput.value = Math.round(currentHue);
    sInput.value = Math.round(currentSat);
    lInput.value = Math.round(currentLight);
    opacityValue.textContent = `${currentOpacity}%`;
}

// Color conversion functions
function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
        r: Math.round(255 * f(0)),
        g: Math.round(255 * f(8)),
        b: Math.round(255 * f(4))
    };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return {
        h: h * 360,
        s: s * 100,
        l: l * 100
    };
}

// Canvas interaction
canvas.addEventListener('mousedown', (e) => {
    updateFromCanvas(e);
    canvas.addEventListener('mousemove', updateFromCanvas);
});

function updateFromCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    currentSat = 100 - (x / rect.width) * 100;
    currentLight = 100 - (y / rect.height) * 100;
    updateColor();
}

// Slider events
hueSlider.addEventListener('input', (e) => {
    currentHue = parseFloat(e.target.value);
    updateColor();
});

opacitySlider.addEventListener('input', (e) => {
    currentOpacity = parseFloat(e.target.value);
    updateColor();
});

// Input events
hexInput.addEventListener('input', (e) => {
    const hex = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        currentHue = hsl.h;
        currentSat = hsl.s;
        currentLight = hsl.l;
        hueSlider.value = currentHue;
        updateColor();
    }
});

[rInput, gInput, bInput].forEach(input => {
    input.addEventListener('input', () => {
        const r = parseInt(rInput.value) || 0;
        const g = parseInt(gInput.value) || 0;
        const b = parseInt(bInput.value) || 0;
        const hsl = rgbToHsl(r, g, b);
        currentHue = hsl.h;
        currentSat = hsl.s;
        currentLight = hsl.l;
        hueSlider.value = currentHue;
        updateColor();
    });
});

[hInput, sInput, lInput].forEach(input => {
    input.addEventListener('input', () => {
        currentHue = parseFloat(hInput.value) || 0;
        currentSat = parseFloat(sInput.value) || 0;
        currentLight = parseFloat(lInput.value) || 0;
        hueSlider.value = currentHue;
        updateColor();
    });
});

// Copy function
function copyValue(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    document.execCommand('copy');
    
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 1000);
}

// Color history
function addToHistory() {
    const rgb = hslToRgb(currentHue, currentSat, currentLight);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentOpacity / 100})`;
    
    // Remove if already exists
    colorHistory = colorHistory.filter(c => c.hex !== hex);
    
    // Add to beginning
    colorHistory.unshift({ hex, rgba });
    
    // Keep only last 20
    colorHistory = colorHistory.slice(0, 20);
    
    localStorage.setItem('colorHistory', JSON.stringify(colorHistory));
    renderHistory();
}

function renderHistory() {
    if (colorHistory.length === 0) {
        swatchGrid.innerHTML = '<div class="empty-swatches">Pick colors to build history</div>';
        return;
    }
    
    swatchGrid.innerHTML = '';
    colorHistory.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.background = color.rgba;
        swatch.title = color.hex;
        swatch.addEventListener('click', () => {
            const rgb = hexToRgb(color.hex);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            currentHue = hsl.h;
            currentSat = hsl.s;
            currentLight = hsl.l;
            hueSlider.value = currentHue;
            updateColor();
        });
        swatchGrid.appendChild(swatch);
    });
}

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all color history?')) {
        colorHistory = [];
        localStorage.removeItem('colorHistory');
        renderHistory();
    }
});

// Add to history on color change (debounced)
let historyTimeout;
function scheduleHistoryUpdate() {
    clearTimeout(historyTimeout);
    historyTimeout = setTimeout(addToHistory, 500);
}

canvas.addEventListener('mouseup', scheduleHistoryUpdate);
hueSlider.addEventListener('change', scheduleHistoryUpdate);
opacitySlider.addEventListener('change', scheduleHistoryUpdate);

// EyeDropper API
eyeDropperBtn.addEventListener('click', async () => {
    if (!window.EyeDropper) {
        alert('EyeDropper API is not supported in your browser.\n\nTry using Chrome, Edge, or Opera (version 95+).');
        return;
    }
    
    try {
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        const rgb = hexToRgb(result.sRGBHex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        currentHue = hsl.h;
        currentSat = hsl.s;
        currentLight = hsl.l;
        hueSlider.value = currentHue;
        updateColor();
        addToHistory();
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('EyeDropper error:', err);
        }
    }
});

// Initialize
updateColor();
renderHistory();