// Elements
const qrContent = document.getElementById('qrContent');
const qrColor = document.getElementById('qrColor');
const qrSize = document.getElementById('qrSize');
const sizeValue = document.getElementById('sizeValue');
const errorLevel = document.getElementById('errorLevel');
const errorValue = document.getElementById('errorValue');
const downloadBtn = document.getElementById('downloadBtn');
const qrPreview = document.getElementById('qrPreview');

let currentQRCode = null;

const errorLevels = ['L', 'M', 'Q', 'H'];
const errorLabels = ['Low', 'Medium', 'Quartile', 'High'];

// Update size display
qrSize.addEventListener('input', (e) => {
    sizeValue.textContent = e.target.value;
    generateQRCode();
});

// Update error level display
errorLevel.addEventListener('input', (e) => {
    errorValue.textContent = errorLabels[e.target.value];
    generateQRCode();
});

// Auto-generate on input
qrContent.addEventListener('input', generateQRCode);
qrColor.addEventListener('input', generateQRCode);

// Generate QR Code
function generateQRCode() {
    const content = qrContent.value.trim();
    
    if (!content) {
        qrPreview.innerHTML = '<div class="placeholder">Enter content to generate QR code</div>';
        downloadBtn.disabled = true;
        return;
    }
    
    // Clear preview
    qrPreview.innerHTML = '';
    
    // Create QR code
    const size = parseInt(qrSize.value);
    const errorIdx = parseInt(errorLevel.value);
    
    try {
        currentQRCode = new QRCode(qrPreview, {
            text: content,
            width: size,
            height: size,
            colorDark: qrColor.value,
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel[errorLevels[errorIdx]]
        });
        
        downloadBtn.disabled = false;
        
    } catch (error) {
        qrPreview.innerHTML = '<div class="placeholder">Error generating QR code</div>';
        downloadBtn.disabled = true;
        console.error(error);
    }
}

// Download QR Code
function downloadQRCode() {
    const canvas = qrPreview.querySelector('canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// History elements
const historySection = document.getElementById('historySection');
const historyGrid = document.getElementById('historyGrid');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

let history = JSON.parse(localStorage.getItem('qrHistory') || '[]');

// Save to history
function saveToHistory() {
    const content = qrContent.value.trim();
    if (!content) return;
    
    const qrData = {
        id: Date.now(),
        content: content,
        color: qrColor.value,
        size: parseInt(qrSize.value),
        errorLevel: parseInt(errorLevel.value),
        timestamp: new Date().toISOString()
    };
    
    // Avoid duplicates
    const exists = history.some(item => 
        item.content === qrData.content && 
        item.color === qrData.color
    );
    
    if (!exists) {
        history.unshift(qrData);
        // Keep last 20
        if (history.length > 20) {
            history = history.slice(0, 20);
        }
        localStorage.setItem('qrHistory', JSON.stringify(history));
        renderHistory();
    }
}

// Render history
function renderHistory() {
    if (history.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    historyGrid.innerHTML = '';
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const qrContainer = document.createElement('div');
        qrContainer.className = 'history-qr';
        
        // Generate QR for history item
        new QRCode(qrContainer, {
            text: item.content,
            width: 150,
            height: 150,
            colorDark: item.color,
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel[errorLevels[item.errorLevel]]
        });
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'history-content';
        contentDiv.textContent = item.content;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'history-actions';
        
        const downloadHistoryBtn = document.createElement('button');
        downloadHistoryBtn.className = 'btn-history btn-download-history';
        downloadHistoryBtn.textContent = '⬇ Download';
        downloadHistoryBtn.onclick = () => downloadHistoryItem(qrContainer);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-history btn-delete';
        deleteBtn.textContent = '🗑 Delete';
        deleteBtn.onclick = () => deleteHistoryItem(item.id);
        
        actionsDiv.appendChild(downloadHistoryBtn);
        actionsDiv.appendChild(deleteBtn);
        
        historyItem.appendChild(qrContainer);
        historyItem.appendChild(contentDiv);
        historyItem.appendChild(actionsDiv);
        
        historyGrid.appendChild(historyItem);
    });
}

// Download history item
function downloadHistoryItem(container) {
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Delete history item
function deleteHistoryItem(id) {
    history = history.filter(item => item.id !== id);
    localStorage.setItem('qrHistory', JSON.stringify(history));
    renderHistory();
}

// Clear all history
function clearHistory() {
    if (confirm('Clear all QR code history?')) {
        history = [];
        localStorage.removeItem('qrHistory');
        renderHistory();
    }
}

// Event listeners
downloadBtn.addEventListener('click', () => {
    downloadQRCode();
    saveToHistory();
});

clearHistoryBtn.addEventListener('click', clearHistory);

// Generate default QR code on load
generateQRCode();
renderHistory();
