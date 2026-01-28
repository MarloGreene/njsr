// State management
let entries = [];
let trashedEntries = [];
let filteredEntries = [];
let selectedColor = 'none';
let currentLocation = null;
let locationEnabled = false;
let viewMode = 'sticky'; // 'list', 'pile', 'sticky', or 'compact'
let searchQuery = '';
let isMinimized = false;
let isViewingTrash = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
    loadTrashedEntries();
    loadViewMode();
    loadLocationPreference();
    loadMinimizeState();
    renderEntries();
    updateTrashCount();
    focusInput();
    setupColorPicker();
    setupKeyboardShortcuts();
});

// Focus input on load
function focusInput() {
    document.getElementById('entryInput').focus();
}

// Request user location (optional)
function requestLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                locationEnabled = true;
                updateLocationButton();
                saveLocationPreference();
            },
            (error) => {
                console.log('Location not available:', error.message);
                locationEnabled = false;
                currentLocation = null;
                updateLocationButton();
                alert('Location access denied or unavailable.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Get approximate location name (using reverse geocoding would require API)
function getLocationString() {
    if (!currentLocation || !locationEnabled) return null;
    // Simple lat/lng display - in production, you might use a geocoding API
    return `${currentLocation.lat.toFixed(2)}°, ${currentLocation.lng.toFixed(2)}°`;
}

// Toggle location tracking
function toggleLocation() {
    if (locationEnabled) {
        // Disable location
        locationEnabled = false;
        currentLocation = null;
        updateLocationButton();
        saveLocationPreference();
    } else {
        // Enable location - request permission
        requestLocation();
    }
}

// Update location button text and style
function updateLocationButton() {
    const btn = document.getElementById('locationToggle');
    if (locationEnabled) {
        btn.textContent = '📍 Location On';
        btn.title = 'Disable location tracking';
        btn.style.background = '#27ae60';
    } else {
        btn.textContent = '📍 Location Off';
        btn.title = 'Enable location tracking';
        btn.style.background = '';
    }
}

// Save location preference
function saveLocationPreference() {
    localStorage.setItem('locationEnabled', locationEnabled);
}

// Load location preference
function loadLocationPreference() {
    const saved = localStorage.getItem('locationEnabled');
    if (saved === 'true') {
        requestLocation();
    } else {
        updateLocationButton();
    }
}

// Toggle minimize state
function toggleMinimize() {
    isMinimized = !isMinimized;
    const content = document.getElementById('collapsibleContent');
    const btn = document.getElementById('minimizeToggle');
    const label = document.getElementById('minimizeLabel');
    
    if (isMinimized) {
        content.classList.add('minimized');
        btn.classList.add('minimized');
        btn.title = 'Show controls';
        label.textContent = 'Expand';
        document.body.classList.add('minimized');
    } else {
        content.classList.remove('minimized');
        btn.classList.remove('minimized');
        btn.title = 'Minimize controls';
        label.textContent = 'Collapse';
        document.body.classList.remove('minimized');
    }
    
    saveMinimizeState();
}

// Save minimize state
function saveMinimizeState() {
    localStorage.setItem('isMinimized', isMinimized);
}

// Load minimize state
function loadMinimizeState() {
    const saved = localStorage.getItem('isMinimized');
    if (saved === 'true') {
        isMinimized = true;
        const content = document.getElementById('collapsibleContent');
        const btn = document.getElementById('minimizeToggle');
        const label = document.getElementById('minimizeLabel');
        content.classList.add('minimized');
        btn.classList.add('minimized');
        btn.title = 'Show controls';
        label.textContent = 'Expand';
        document.body.classList.add('minimized');
    }
}

// Color picker setup
function setupColorPicker() {
    const colorBtns = document.querySelectorAll('.input-section .color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            colorBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedColor = btn.dataset.color;
        });
    });
    // Select first button (none) by default
    colorBtns[0].classList.add('selected');
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    const input = document.getElementById('entryInput');
    input.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to save
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            saveEntry();
        }
    });
}

// Save entry
function saveEntry() {
    const input = document.getElementById('entryInput');
    const text = input.value.trim();
    
    if (!text) {
        input.focus();
        return;
    }

    // Limit entry size to prevent DoS
    if (text.length > 50000) {
        alert('Entry too long! Maximum 50,000 characters.');
        return;
    }

    const entry = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toISOString(),
        location: getLocationString(),
        color: selectedColor !== 'none' && isValidColor(selectedColor) ? selectedColor : null
    };

    entries.unshift(entry); // Add to beginning
    saveToLocalStorage();
    renderEntries();
    
    // Clear input and reset
    input.value = '';
    resetColorPicker();
    input.focus();
    
    // Animate save
    const firstCard = document.querySelector('.entry-card');
    if (firstCard) {
        firstCard.style.animation = 'none';
        setTimeout(() => {
            firstCard.style.animation = '';
        }, 10);
    }
}

// Reset color picker to default
function resetColorPicker() {
    const colorBtns = document.querySelectorAll('.input-section .color-btn');
    colorBtns.forEach(b => b.classList.remove('selected'));
    colorBtns[0].classList.add('selected');
    selectedColor = 'none';
}

// Load entries from localStorage
function loadEntries() {
    const stored = localStorage.getItem('journalEntries');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Validate it's an array
            if (Array.isArray(parsed)) {
                // Sanitize all loaded entries
                entries = parsed.map(entry => sanitizeEntry(entry));
            } else {
                entries = [];
            }
        } catch (e) {
            console.error('Error loading entries:', e);
            entries = [];
        }
    }
}

// Save to localStorage
function saveToLocalStorage() {
    try {
        const dataStr = JSON.stringify(entries);
        
        // Check size (localStorage limit is typically 5-10MB)
        if (dataStr.length > 5 * 1024 * 1024) {
            alert('Storage limit reached! Consider exporting and deleting old entries.');
            return;
        }
        
        localStorage.setItem('journalEntries', dataStr);
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            alert('Storage quota exceeded! Export your data and delete some entries.');
        } else {
            console.error('Error saving to localStorage:', error);
        }
    }
}

// Load trashed entries from localStorage
function loadTrashedEntries() {
    const stored = localStorage.getItem('trashedEntries');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Validate it's an array
            if (Array.isArray(parsed)) {
                // Sanitize all loaded entries
                trashedEntries = parsed.map(entry => sanitizeEntry(entry));
            } else {
                trashedEntries = [];
            }
        } catch (e) {
            console.error('Error loading trashed entries:', e);
            trashedEntries = [];
        }
    }
}

// Save trashed entries to localStorage
function saveTrashedEntries() {
    try {
        const dataStr = JSON.stringify(trashedEntries);
        
        // Check size
        if (dataStr.length > 5 * 1024 * 1024) {
            alert('Trash storage limit reached! Consider permanently deleting some entries.');
            return;
        }
        
        localStorage.setItem('trashedEntries', dataStr);
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            alert('Trash storage quota exceeded! Permanently delete some entries.');
        } else {
            console.error('Error saving trashed entries to localStorage:', error);
        }
    }
}

// Load view mode preference
function loadViewMode() {
    const saved = localStorage.getItem('viewMode');
    if (saved && ['list', 'pile', 'sticky', 'compact'].includes(saved)) {
        viewMode = saved;
    }
    
    // Apply the view mode (including default)
    const container = document.getElementById('entriesContainer');
    const toggleBtn = document.getElementById('viewToggle');
    const headerToggleLabel = document.getElementById('headerViewLabel');
    
    container.classList.remove('pile-view', 'sticky-view', 'compact-view');
    if (viewMode === 'pile') {
        container.classList.add('pile-view');
        toggleBtn.textContent = '📝 Sticky View';
        toggleBtn.title = 'Toggle sticky notes view';
        if (headerToggleLabel) headerToggleLabel.textContent = 'Sticky View';
    } else if (viewMode === 'sticky') {
        container.classList.add('sticky-view');
        toggleBtn.textContent = '📄 Compact View';
        toggleBtn.title = 'Toggle compact view';
        if (headerToggleLabel) headerToggleLabel.textContent = 'Compact View';
    } else if (viewMode === 'compact') {
        container.classList.add('compact-view');
        toggleBtn.textContent = '📋 List View';
        toggleBtn.title = 'Toggle list view';
        if (headerToggleLabel) headerToggleLabel.textContent = 'List View';
    } else {
        toggleBtn.textContent = '📚 Pile View';
        toggleBtn.title = 'Toggle pile view';
        if (headerToggleLabel) headerToggleLabel.textContent = 'Pile View';
    }
}

// Save view mode preference
function saveViewMode() {
    localStorage.setItem('viewMode', viewMode);
}

// Render entries
function renderEntries() {
    updateEntryCount();
    const container = document.getElementById('entriesContainer');
    const emptyState = document.getElementById('emptyState');
    
    const displayEntries = isViewingTrash ? trashedEntries : entries;
    
    if (displayEntries.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        if (isViewingTrash) {
            emptyState.innerHTML = '<p>🗑️ Trash is empty.</p>';
        } else {
            emptyState.innerHTML = '<p>✨ Your journal is empty. Start typing above!</p>';
        }
        return;
    }
    
    emptyState.style.display = 'none';
    
    if (isViewingTrash) {
        // Render trash view with restore and permanent delete buttons
        container.innerHTML = displayEntries.map(entry => {
            const date = new Date(entry.timestamp);
            const colorClass = entry.color && isValidColor(entry.color) ? `color-${entry.color}` : '';
            
            return `
                <div class="entry-card ${colorClass} trashed" data-id="${entry.id}">
                    <div class="entry-header">
                        <div class="entry-meta">
                            <span class="entry-date">${formatDate(date)}</span>
                            ${entry.location ? `<span class="entry-location">📍 ${escapeHtml(entry.location)}</span>` : ''}
                        </div>
                        <div class="trash-actions">
                            <button class="restore-btn" onclick="restoreEntry(${entry.id})" title="Restore entry">↩️</button>
                            <button class="permanent-delete-btn" onclick="permanentlyDelete(${entry.id})" title="Permanently delete">🗑️</button>
                        </div>
                    </div>
                    <div class="entry-text">${escapeHtml(entry.text)}</div>
                </div>
            `;
        }).join('');
    } else {
        // Normal view
        container.innerHTML = displayEntries.map(entry => {
            const date = new Date(entry.timestamp);
            const colorClass = entry.color && isValidColor(entry.color) ? `color-${entry.color}` : '';
            const clickHandler = (viewMode === 'sticky' || viewMode === 'compact') ? `onclick="openEntryModal(${entry.id})"` : '';
            
            return `
                <div class="entry-card ${colorClass}" data-id="${entry.id}" ${clickHandler}>
                    <div class="entry-header">
                        <div class="entry-meta">
                            <span class="entry-date">${formatDate(date)}</span>
                            ${entry.location ? `<span class="entry-location">📍 ${escapeHtml(entry.location)}</span>` : ''}
                        </div>
                        <button class="delete-btn" onclick="event.stopPropagation(); deleteEntry(${entry.id})" title="Move to trash">×</button>
                    </div>
                    <div class="entry-text">${escapeHtml(entry.text)}</div>
                </div>
            `;
        }).join('');
    }
}

// Format date
function formatDate(date) {
    // Validate date object
    if (!date || isNaN(date.getTime())) {
        return 'Invalid date';
    }
    
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (days === 1) {
        return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (days < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate color values
function isValidColor(color) {
    const validColors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 
                        'soft-pink', 'soft-peach', 'soft-mint', 'soft-lavender', 
                        'soft-gray', 'soft-teal'];
    return validColors.includes(color);
}

// Sanitize entry data
function sanitizeEntry(entry) {
    return {
        id: typeof entry.id === 'number' ? entry.id : Date.now(),
        text: typeof entry.text === 'string' ? entry.text.substring(0, 50000) : '',
        timestamp: entry.timestamp || new Date().toISOString(),
        location: typeof entry.location === 'string' ? entry.location.substring(0, 200) : null,
        color: entry.color && isValidColor(entry.color) ? entry.color : null
    };
}

// Update entry count display
function updateEntryCount() {
    const countEl = document.getElementById('entryCount');
    if (countEl) {
        if (isViewingTrash) {
            const count = trashedEntries.length;
            countEl.textContent = `${count} trashed ${count === 1 ? 'note' : 'notes'}`;
        } else {
            const count = entries.length;
            countEl.textContent = `${count} ${count === 1 ? 'note' : 'notes'}`;
        }
    }
}

// Update trash count display
function updateTrashCount() {
    const countEl = document.getElementById('trashCount');
    if (countEl) {
        countEl.textContent = trashedEntries.length;
    }
    
    // Update button visibility/style
    const trashToggle = document.getElementById('trashToggle');
    if (trashToggle) {
        if (trashedEntries.length === 0) {
            trashToggle.style.opacity = '0.3';
        } else {
            trashToggle.style.opacity = '1';
        }
    }
}

// Toggle trash view
function toggleTrashView() {
    isViewingTrash = !isViewingTrash;
    
    const trashToggle = document.getElementById('trashToggle');
    const entryInput = document.getElementById('entryInput');
    const colorPicker = document.querySelector('.input-section .color-picker');
    const locationToggle = document.getElementById('locationToggle');
    
    if (isViewingTrash) {
        // Viewing trash
        trashToggle.style.background = '#e74c3c';
        trashToggle.title = 'Back to notes';
        
        // Hide entry input and controls when viewing trash
        if (entryInput) entryInput.style.display = 'none';
        if (colorPicker) colorPicker.style.display = 'none';
        if (locationToggle) locationToggle.style.display = 'none';
    } else {
        // Back to normal view
        trashToggle.style.background = '';
        trashToggle.title = 'View trashed notes';
        
        // Show entry input and controls
        if (entryInput) entryInput.style.display = 'block';
        if (colorPicker) colorPicker.style.display = 'flex';
        if (locationToggle) locationToggle.style.display = 'inline-block';
    }
    
    renderEntries();
}

// Delete entry (move to trash)
function deleteEntry(id) {
    // Validate ID
    if (!id || typeof id !== 'number') return;
    
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    // Move to trash without confirmation
    entries = entries.filter(e => e.id !== id);
    trashedEntries.unshift(entry); // Add to beginning of trash
    saveToLocalStorage();
    saveTrashedEntries();
    renderEntries();
    updateTrashCount();
}

// Restore entry from trash
function restoreEntry(id) {
    // Validate ID
    if (!id || typeof id !== 'number') return;
    
    const entry = trashedEntries.find(e => e.id === id);
    if (!entry) return;
    
    // Move back to main entries
    trashedEntries = trashedEntries.filter(e => e.id !== id);
    entries.unshift(entry);
    saveToLocalStorage();
    saveTrashedEntries();
    renderEntries();
    updateTrashCount();
}

// Permanently delete entry from trash
function permanentlyDelete(id) {
    // Validate ID
    if (!id || typeof id !== 'number') return;
    
    const entry = trashedEntries.find(e => e.id === id);
    if (!entry) return;
    
    const preview = entry.text.length > 50 ? entry.text.substring(0, 50) + '...' : entry.text;
    const confirmation = confirm(
        `⚠️ PERMANENT DELETE ⚠️\n\nThis will permanently delete this entry. This action CANNOT be undone.\n\n"${preview}"\n\nAre you absolutely sure?`
    );
    
    if (confirmation) {
        const doubleCheck = confirm(
            `🚨 FINAL WARNING 🚨\n\nThis entry will be gone forever. There is no way to recover it.\n\nProceed with permanent deletion?`
        );
        
        if (doubleCheck) {
            trashedEntries = trashedEntries.filter(e => e.id !== id);
            saveTrashedEntries();
            renderEntries();
            updateTrashCount();
        }
    }
}

// Nuke all data (clear everything)
function nukeAllData() {
    const confirmation = confirm(
        `🚨 NUCLEAR OPTION 🚨\n\nThis will DELETE ALL DATA:\n• All active notes (${entries.length})\n• All trashed notes (${trashedEntries.length})\n• All settings\n\nThis CANNOT be undone. Everything will be lost forever.\n\nAre you ABSOLUTELY SURE?`
    );
    
    if (confirmation) {
        const doubleCheck = confirm(
            `⚠️ FINAL CONFIRMATION ⚠️\n\nYou are about to delete ${entries.length + trashedEntries.length} total notes.\n\nType 'DELETE' in your mind and click OK to proceed, or Cancel to abort.`
        );
        
        if (doubleCheck) {
            const tripleCheck = confirm(
                `🔥 LAST CHANCE 🔥\n\nClicking OK will immediately erase everything.\n\nThis is your final opportunity to cancel.\n\nProceed with total data destruction?`
            );
            
            if (tripleCheck) {
                // Clear everything
                entries = [];
                trashedEntries = [];
                localStorage.clear();
                isViewingTrash = false;
                renderEntries();
                updateTrashCount();
                alert('✨ All data has been permanently deleted. Fresh start!');
            }
        }
    }
}

// Filter entries based on search query
function filterEntries() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchQuery = searchInput.value.toLowerCase().trim();
    
    const container = document.getElementById('entriesContainer');
    const emptyState = document.getElementById('emptyState');
    
    let displayEntries = isViewingTrash ? trashedEntries : entries;
    
    if (searchQuery) {
        displayEntries = displayEntries.filter(entry => 
            entry.text.toLowerCase().includes(searchQuery) ||
            (entry.location && entry.location.toLowerCase().includes(searchQuery))
        );
    }
    
    if (displayEntries.length === 0) {
        container.innerHTML = '';
        if (searchQuery) {
            emptyState.innerHTML = '<p>🔍 No entries match your search.</p>';
        } else if (isViewingTrash) {
            emptyState.innerHTML = '<p>🗑️ Trash is empty.</p>';
        } else {
            emptyState.innerHTML = '<p>✨ Your journal is empty. Start typing above!</p>';
        }
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    if (isViewingTrash) {
        container.innerHTML = displayEntries.map(entry => {
            const date = new Date(entry.timestamp);
            const colorClass = entry.color && isValidColor(entry.color) ? `color-${entry.color}` : '';
            
            return `
                <div class="entry-card ${colorClass} trashed" data-id="${entry.id}">
                    <div class="entry-header">
                        <div class="entry-meta">
                            <span class="entry-date">${formatDate(date)}</span>
                            ${entry.location ? `<span class="entry-location">📍 ${escapeHtml(entry.location)}</span>` : ''}
                        </div>
                        <div class="trash-actions">
                            <button class="restore-btn" onclick="restoreEntry(${entry.id})" title="Restore entry">↩️</button>
                            <button class="permanent-delete-btn" onclick="permanentlyDelete(${entry.id})" title="Permanently delete">🗑️</button>
                        </div>
                    </div>
                    <div class="entry-text">${escapeHtml(entry.text)}</div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = displayEntries.map(entry => {
            const date = new Date(entry.timestamp);
            const colorClass = entry.color && isValidColor(entry.color) ? `color-${entry.color}` : '';
            const clickHandler = (viewMode === 'sticky' || viewMode === 'compact') ? `onclick="openEntryModal(${entry.id})"` : '';
            
            return `
                <div class="entry-card ${colorClass}" data-id="${entry.id}" ${clickHandler}>
                    <div class="entry-header">
                        <div class="entry-meta">
                            <span class="entry-date">${formatDate(date)}</span>
                            ${entry.location ? `<span class="entry-location">📍 ${escapeHtml(entry.location)}</span>` : ''}
                        </div>
                        <button class="delete-btn" onclick="event.stopPropagation(); deleteEntry(${entry.id})" title="Move to trash">×</button>
                    </div>
                    <div class="entry-text">${escapeHtml(entry.text)}</div>
                </div>
            `;
        }).join('');
    }
}

// Sorting functions
function sortEntries(mode) {
    const targetArray = isViewingTrash ? trashedEntries : entries;
    
    switch(mode) {
        case 'newest':
            targetArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            break;
        case 'oldest':
            targetArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            break;
        case 'longest':
            targetArray.sort((a, b) => b.text.length - a.text.length);
            break;
        case 'shortest':
            targetArray.sort((a, b) => a.text.length - b.text.length);
            break;
        case 'color':
            const colorOrder = { 'red': 1, 'orange': 2, 'yellow': 3, 'green': 4, 'blue': 5, 'purple': 6 };
            targetArray.sort((a, b) => {
                const aColor = a.color || 'zzz'; // no color goes to end
                const bColor = b.color || 'zzz';
                const aOrder = colorOrder[aColor] || 999;
                const bOrder = colorOrder[bColor] || 999;
                return aOrder - bOrder;
            });
            break;
    }
    renderEntries();
}

// Shuffle entries
function shuffleEntries() {
    const targetArray = isViewingTrash ? trashedEntries : entries;
    for (let i = targetArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetArray[i], targetArray[j]] = [targetArray[j], targetArray[i]];
    }
    renderEntries();
}

// Toggle between list, pile, sticky, and compact views
function toggleView() {
    const container = document.getElementById('entriesContainer');
    const toggleBtn = document.getElementById('viewToggle');
    const headerToggleLabel = document.getElementById('headerViewLabel');
    
    // Cycle through views: list -> pile -> sticky -> compact -> list
    if (viewMode === 'list') {
        viewMode = 'pile';
        container.classList.remove('sticky-view', 'compact-view');
        container.classList.add('pile-view');
        toggleBtn.textContent = '📝 Sticky View';
        toggleBtn.title = 'Toggle sticky notes view';
        if (headerToggleLabel) headerToggleLabel.textContent = 'Sticky View';
    } else if (viewMode === 'pile') {
        viewMode = 'sticky';
        container.classList.remove('pile-view', 'compact-view');
        container.classList.add('sticky-view');
        toggleBtn.textContent = '📄 Compact View';
        toggleBtn.title = 'Toggle compact view';
        if (headerToggleLabel) headerToggleLabel.textContent = 'Compact View';
    } else if (viewMode === 'sticky') {
        viewMode = 'compact';
        container.classList.remove('pile-view', 'sticky-view');
        container.classList.add('compact-view');
        toggleBtn.textContent = '📋 List View';
        toggleBtn.title = 'Toggle list view';
        if (headerToggleLabel) headerToggleLabel.textContent = 'List View';
    } else {
        viewMode = 'list';
        container.classList.remove('sticky-view', 'pile-view', 'compact-view');
        toggleBtn.textContent = '📚 Pile View';
        toggleBtn.title = 'Toggle pile view';
        if (headerToggleLabel) headerToggleLabel.textContent = 'Pile View';
    }
    
    saveViewMode();
}

// Export as text
function exportAsText() {
    if (entries.length === 0) {
        alert('No entries to export!');
        return;
    }
    
    let text = 'QUICK JOURNAL EXPORT\n';
    text += '='.repeat(50) + '\n\n';
    
    entries.forEach((entry, index) => {
        const date = new Date(entry.timestamp);
        text += `Entry #${index + 1}\n`;
        text += `Date: ${date.toLocaleString()}\n`;
        if (entry.location) {
            text += `Location: ${entry.location}\n`;
        }
        if (entry.color) {
            text += `Label: ${entry.color}\n`;
        }
        text += '\n' + entry.text + '\n';
        text += '-'.repeat(50) + '\n\n';
    });
    
    downloadFile('journal-export.txt', text, 'text/plain');
}

// Export as JSON
function exportAsJSON() {
    if (entries.length === 0) {
        alert('No entries to export!');
        return;
    }
    
    const json = JSON.stringify(entries, null, 2);
    downloadFile('journal-export.json', json, 'application/json');
}

// Import JSON
function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File too large! Maximum 10MB.');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (!Array.isArray(imported)) {
                alert('Invalid JSON format!');
                return;
            }
            
            // Limit number of entries to prevent DoS
            if (imported.length > 10000) {
                alert('Too many entries! Maximum 10,000 entries per import.');
                return;
            }
            
            // Validate and sanitize entries
            const valid = imported.every(entry => 
                entry.id && entry.text && entry.timestamp
            );
            
            if (!valid) {
                alert('Invalid entry format in JSON!');
                return;
            }
            
            // Sanitize all imported entries
            const sanitizedEntries = imported.map(sanitizeEntry);
            
            // Merge with existing entries (avoid duplicates by ID)
            const existingIds = new Set(entries.map(e => e.id));
            const newEntries = sanitizedEntries.filter(e => !existingIds.has(e.id));
            
            if (newEntries.length === 0) {
                alert('No new entries to import (all already exist).');
                return;
            }
            
            entries = [...entries, ...newEntries];
            sortEntries('newest'); // Sort after import
            saveToLocalStorage();
            renderEntries();
            
            alert(`Successfully imported ${newEntries.length} entries!`);
        } catch (error) {
            alert('Error importing JSON: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
}

// Download file helper
function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Modal management
let currentEditingId = null;
let modalSelectedColor = 'none';
let modalColorPickerInitialized = false;
let modalHasUnsavedChanges = false;
let modalOriginalText = '';
let autoSaveTimeout = null;

// Auto-save modal changes
function autoSaveModal() {
    const entry = entries.find(e => e.id === currentEditingId);
    if (!entry) return;
    
    const newText = document.getElementById('modalEntryText').value.trim();
    if (!newText) return;
    
    // Limit entry size
    if (newText.length > 50000) return;
    
    entry.text = newText;
    entry.color = modalSelectedColor !== 'none' && isValidColor(modalSelectedColor) ? modalSelectedColor : null;
    
    saveToLocalStorage();
    renderEntries();
    modalHasUnsavedChanges = false;
    modalOriginalText = newText;
}

// Track changes in modal
function onModalTextChange() {
    const currentText = document.getElementById('modalEntryText').value;
    modalHasUnsavedChanges = currentText !== modalOriginalText;
    
    // Debounced auto-save (1 second after typing stops)
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        autoSaveModal();
    }, 1000);
}

// Setup modal color picker (only once)
function setupModalColorPicker() {
    if (modalColorPickerInitialized) return;
    
    const modalColorBtns = document.querySelectorAll('.modal-color-btn');
    modalColorBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modalColorBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            modalSelectedColor = btn.dataset.color;
            
            // Mark as changed and trigger auto-save
            modalHasUnsavedChanges = true;
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                autoSaveModal();
            }, 500);
        });
    });
    
    modalColorPickerInitialized = true;
}

// Open entry in modal
function openEntryModal(id) {
    // Don't allow editing in trash view
    if (isViewingTrash) return;
    
    // Validate ID
    if (!id || typeof id !== 'number') return;
    
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    currentEditingId = id;
    modalSelectedColor = entry.color || 'none';
    modalHasUnsavedChanges = false;
    modalOriginalText = entry.text;
    
    // Setup modal color picker if not already done
    setupModalColorPicker();
    
    // Populate modal
    const textArea = document.getElementById('modalEntryText');
    textArea.value = entry.text;
    
    // Add change listener for auto-save
    textArea.removeEventListener('input', onModalTextChange);
    textArea.addEventListener('input', onModalTextChange);
    
    const date = new Date(entry.timestamp);
    document.getElementById('modalDate').textContent = `📅 ${formatDate(date)}`;
    document.getElementById('modalLocation').textContent = entry.location ? `📍 ${entry.location}` : '';
    
    // Set color picker selection
    const modalColorBtns = document.querySelectorAll('.modal-color-btn');
    modalColorBtns.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.color === modalSelectedColor) {
            btn.classList.add('selected');
        }
    });
    
    // Show modal
    document.getElementById('editModal').classList.add('active');
    textArea.focus();
}

// Close modal
function closeModal() {
    // Check for unsaved changes
    if (modalHasUnsavedChanges) {
        const confirmClose = confirm('You have unsaved changes. Close anyway? (Your changes are auto-saved)');
        if (!confirmClose) return;
    }
    
    const modal = document.getElementById('editModal');
    modal.classList.remove('active');
    modal.classList.remove('zen-mode');
    currentEditingId = null;
    modalSelectedColor = 'none';
    modalHasUnsavedChanges = false;
    modalOriginalText = '';
    clearTimeout(autoSaveTimeout);
}

// Toggle zen mode
function toggleZenMode() {
    const modal = document.getElementById('editModal');
    modal.classList.toggle('zen-mode');
}

// Save modal edits
function saveModalEdit() {
    const entry = entries.find(e => e.id === currentEditingId);
    if (!entry) return;
    
    const newText = document.getElementById('modalEntryText').value.trim();
    if (!newText) {
        alert('Entry cannot be empty!');
        return;
    }
    
    // Limit entry size
    if (newText.length > 50000) {
        alert('Entry too long! Maximum 50,000 characters.');
        return;
    }
    
    entry.text = newText;
    entry.color = modalSelectedColor !== 'none' && isValidColor(modalSelectedColor) ? modalSelectedColor : null;
    
    saveToLocalStorage();
    renderEntries();
    modalHasUnsavedChanges = false;
    modalOriginalText = newText;
    closeModal();
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
