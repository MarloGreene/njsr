// Elements
const paletteContainer = document.getElementById('paletteContainer');
const generateBtn = document.getElementById('generateBtn');
const saveBtn = document.getElementById('saveBtn');
const viewSavedBtn = document.getElementById('viewSavedBtn');
const savedModal = document.getElementById('savedModal');
const savedGrid = document.getElementById('savedGrid');
const closeModal = document.getElementById('closeModal');
const savedCount = document.getElementById('savedCount');
const colorWheelBtn = document.getElementById('colorWheelBtn');
const wheelPopup = document.getElementById('wheelPopup');
const closeWheelPopup = document.getElementById('closeWheelPopup');
const colorWheelCanvas = document.getElementById('colorWheelCanvas');

// State
let currentPalette = [];
let lockedColors = new Set();
let savedPalettes = JSON.parse(localStorage.getItem('colorPalettes') || '[]');

// Generate random color
function randomColor() {
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 40) + 60; // 60-100%
    const l = Math.floor(Math.random() * 30) + 40; // 40-70%
    return hslToHex(h, s, l);
}

// HSL to Hex conversion
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
        r = c; g = 0; b = x;
    }

    const toHex = (n) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Hex to HSL conversion
function hexToHSL(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
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
    
    return { h: h * 360, s: s * 100, l: l * 100 };
}

// Get color name (simple approximation)
function getColorName(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2 / 255;
    
    if (l < 0.2) return 'Dark';
    if (l > 0.8) return 'Light';
    
    if (r > g && r > b) return 'Red';
    if (g > r && g > b) return 'Green';
    if (b > r && b > g) return 'Blue';
    if (r > b && g > b) return 'Yellow';
    if (r > g && b > g) return 'Purple';
    if (g > r && b > r) return 'Cyan';
    
    return 'Gray';
}

// Draw color wheel
function drawColorWheel() {
    const canvas = colorWheelCanvas;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
        const startAngle = (angle - 90) * Math.PI / 180;
        const endAngle = (angle + 1 - 90) * Math.PI / 180;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        const hue = angle;
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        ctx.fill();
    }
    
    // Draw white center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Mark current palette colors
    currentPalette.forEach(color => {
        const hsl = hexToHSL(color);
        const angle = (hsl.h - 90) * Math.PI / 180;
        const markerRadius = radius * 0.85;
        
        const x = centerX + Math.cos(angle) * markerRadius;
        const y = centerY + Math.sin(angle) * markerRadius;
        
        // Draw marker
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner color dot
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Draw line to complement (opposite)
        const complementAngle = angle + Math.PI;
        const compX = centerX + Math.cos(complementAngle) * markerRadius;
        const compY = centerY + Math.sin(complementAngle) * markerRadius;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(compX, compY);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
    });
}

// Generate palette
function generatePalette() {
    currentPalette = [];
    for (let i = 0; i < 5; i++) {
        if (lockedColors.has(i) && paletteContainer.children[i]) {
            // Keep locked color
            currentPalette.push(paletteContainer.children[i].style.backgroundColor);
        } else {
            currentPalette.push(randomColor());
        }
    }
    renderPalette();
}

// Render palette
function renderPalette() {
    paletteContainer.innerHTML = '';
    
    currentPalette.forEach((color, index) => {
        const column = document.createElement('div');
        column.className = 'color-column';
        if (lockedColors.has(index)) {
            column.classList.add('locked');
        }
        column.style.backgroundColor = color;
        
        // Lock button
        const lockBtn = document.createElement('button');
        lockBtn.className = 'lock-btn';
        lockBtn.textContent = lockedColors.has(index) ? '🔒' : '🔓';
        lockBtn.onclick = (e) => {
            e.stopPropagation();
            toggleLock(index);
        };
        
        // Color info
        const info = document.createElement('div');
        info.className = 'color-info';
        
        const hexCode = document.createElement('div');
        hexCode.className = 'hex-code';
        hexCode.textContent = color.toUpperCase();
        
        const colorName = document.createElement('div');
        colorName.className = 'color-name';
        colorName.textContent = getColorName(color);
        
        info.appendChild(hexCode);
        info.appendChild(colorName);
        
        info.onclick = () => copyToClipboard(color);
        
        column.appendChild(lockBtn);
        column.appendChild(info);
        
        paletteContainer.appendChild(column);
    });
    
    // Update color wheel if visible
    if (wheelPopup.style.display === 'block') {
        drawColorWheel();
    }
}

// Toggle lock
function toggleLock(index) {
    if (lockedColors.has(index)) {
        lockedColors.delete(index);
    } else {
        lockedColors.add(index);
    }
    renderPalette();
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification(`Copied ${text}`);
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'copied-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Save palette
function savePalette() {
    const palette = {
        id: Date.now(),
        colors: [...currentPalette],
        timestamp: new Date().toISOString()
    };
    
    savedPalettes.unshift(palette);
    
    // Keep last 50
    if (savedPalettes.length > 50) {
        savedPalettes = savedPalettes.slice(0, 50);
    }
    
    localStorage.setItem('colorPalettes', JSON.stringify(savedPalettes));
    updateSavedCount();
    showNotification('Palette saved!');
}

// Load palette
function loadPalette(colors) {
    currentPalette = [...colors];
    lockedColors.clear();
    renderPalette();
    savedModal.style.display = 'none';
}

// Delete palette
function deletePalette(id) {
    savedPalettes = savedPalettes.filter(p => p.id !== id);
    localStorage.setItem('colorPalettes', JSON.stringify(savedPalettes));
    updateSavedCount();
    renderSavedPalettes();
}

// Render saved palettes
function renderSavedPalettes() {
    if (savedPalettes.length === 0) {
        savedGrid.innerHTML = '<div class="empty-state">No saved palettes yet</div>';
        return;
    }
    
    savedGrid.innerHTML = '';
    
    savedPalettes.forEach(palette => {
        const paletteDiv = document.createElement('div');
        paletteDiv.className = 'saved-palette';
        
        const colorsDiv = document.createElement('div');
        colorsDiv.className = 'saved-palette-colors';
        
        palette.colors.forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'saved-palette-color';
            colorDiv.style.backgroundColor = color;
            colorsDiv.appendChild(colorDiv);
        });
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'saved-palette-actions';
        
        const loadBtn = document.createElement('button');
        loadBtn.className = 'saved-palette-btn btn-load';
        loadBtn.textContent = 'Load';
        loadBtn.onclick = () => loadPalette(palette.colors);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'saved-palette-btn btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deletePalette(palette.id);
        
        actionsDiv.appendChild(loadBtn);
        actionsDiv.appendChild(deleteBtn);
        
        paletteDiv.appendChild(colorsDiv);
        paletteDiv.appendChild(actionsDiv);
        
        savedGrid.appendChild(paletteDiv);
    });
}

// Update saved count
function updateSavedCount() {
    savedCount.textContent = savedPalettes.length;
}

// Event listeners
generateBtn.addEventListener('click', generatePalette);
saveBtn.addEventListener('click', savePalette);
viewSavedBtn.addEventListener('click', () => {
    savedModal.style.display = 'flex';
    renderSavedPalettes();
});
closeModal.addEventListener('click', () => {
    savedModal.style.display = 'none';
});
savedModal.addEventListener('click', (e) => {
    if (e.target === savedModal) {
        savedModal.style.display = 'none';
    }
});

colorWheelBtn.addEventListener('click', () => {
    const isVisible = wheelPopup.style.display === 'block';
    wheelPopup.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
        drawColorWheel();
    }
});
closeWheelPopup.addEventListener('click', () => {
    wheelPopup.style.display = 'none';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        generatePalette();
    }
    if (e.code === 'KeyS' && e.target === document.body) {
        e.preventDefault();
        savePalette();
    }
});

// Initialize
generatePalette();
updateSavedCount();
drawColorWheel();
