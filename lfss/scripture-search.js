let scriptures = [];
let activeScriptures = []; // Current search base (locked results or all scriptures)
let lockedFilters = []; // Stack of locked search terms
let lockedVerses = []; // Individual locked verses
let favoriteVerses = []; // Favorite verses
let searchInput;
let statsDiv;
let resultsDiv;
let caseSensitiveCheckbox;
let wholeWordCheckbox;
let maxResultsSelect;
let lockButton;
let lockedFiltersDiv;
let lockedResultsPreview;
let lockedResultsContent;
let currentSearchHeader;
let togglePreviewButton;
let previewCollapsed = false;
let volumeFilters = {};
let lockedVersesSection;
let lockedVersesList;
let favoritesSection;
let favoritesList;

// Book categorization
const BIBLE_BOOKS = [
    // Old Testament
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
    'Esther', 'Job', 'Psalm', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    // New Testament
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

const BOM_BOOKS = [
    '1 Nephi', '2 Nephi', 'Jacob', 'Enos', 'Jarom', 'Omni', 'Words of Mormon',
    'Mosiah', 'Alma', 'Helaman', '3 Nephi', '4 Nephi', 'Mormon', 'Ether', 'Moroni'
];

const DC_BOOKS = ['Doctrine and Covenants', 'D&C'];

const PGP_BOOKS = [
    'Moses', 
    'Abraham', 
    'Joseph Smith--Matthew', 
    'Joseph Smith--History', 
    'Articles of Faith'
];

function extractBookName(reference) {
    // Handle "Doctrine and Covenants" specially (multi-word before number)
    if (reference.startsWith('Doctrine and Covenants')) {
        return 'Doctrine and Covenants';
    }
    
    // Handle Joseph Smith books with double dashes
    if (reference.startsWith('Joseph Smith--')) {
        const match = reference.match(/^(Joseph Smith--[^\s]+)/);
        if (match) return match[1];
    }
    
    // Handle "Words of Mormon" and "Song of Solomon"
    if (reference.startsWith('Words of Mormon')) {
        return 'Words of Mormon';
    }
    if (reference.startsWith('Song of Solomon')) {
        return 'Song of Solomon';
    }
    if (reference.startsWith('Articles of Faith')) {
        return 'Articles of Faith';
    }
    
    // Extract everything before the chapter:verse pattern
    const match = reference.match(/^(.+?)\s+\d+:\d+/);
    if (match) {
        return match[1].trim();
    }
    
    // Fallback: split on first space followed by digit
    const parts = reference.split(/\s+(?=\d)/);
    return parts[0];
}

function getVolumeForBook(bookName) {
    if (BIBLE_BOOKS.includes(bookName)) return 'bible';
    if (BOM_BOOKS.includes(bookName)) return 'bom';
    if (DC_BOOKS.includes(bookName)) return 'dc';
    if (PGP_BOOKS.includes(bookName)) return 'pgp';
    return 'unknown';
}

// Load and parse scriptures
async function loadScriptures() {
    try {
        const response = await fetch('lds-scriptures.txt');
        const text = await response.text();
        
        // Split by newlines and parse
        scriptures = text.split('\n')
            .filter(line => line.trim())
            .map(line => {
                // Format: "Reference     Verse text" (multiple spaces separate reference from text)
                // Match: book name + chapter:verse + multiple spaces + text
                const match = line.match(/^(.+?\s+\d+:\d+)\s{2,}(.+)$/);
                if (match) {
                    const reference = match[1].trim();
                    const text = match[2].trim();
                    const bookName = extractBookName(reference);
                    return {
                        reference,
                        text,
                        volume: getVolumeForBook(bookName)
                    };
                }
                
                // Fallback for lines that don't match expected format
                return {
                    reference: '',
                    text: line,
                    volume: 'unknown'
                };
            });
        
        activeScriptures = scriptures; // Initialize active set to all scriptures
        statsDiv.textContent = `${scriptures.length.toLocaleString()} verses loaded. Start typing to search!`;
        searchInput.disabled = false;
        searchInput.focus();
    } catch (error) {
        console.error('Error loading scriptures:', error);
        statsDiv.textContent = 'Error loading scriptures. Please check the file path.';
        statsDiv.style.color = '#d32f2f';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Highlight search terms in text
function highlightText(text, searchTerm, caseSensitive, wholeWord) {
    if (!searchTerm) return typeof text === 'string' && !text.includes('<') ? escapeHtml(text) : text;
    
    // If text already contains HTML (from previous highlighting), work with it directly
    const escaped = typeof text === 'string' && !text.includes('<') ? escapeHtml(text) : text;
    
    if (wholeWord) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(`\\b(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, flags);
        return escaped.replace(regex, '<span class="highlight">$1</span>');
    } else {
        if (caseSensitive) {
            const parts = escaped.split(searchTerm);
            return parts.join(`<span class="highlight">${searchTerm}</span>`);
        } else {
            const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return escaped.replace(regex, '<span class="highlight">$1</span>');
        }
    }
}

// Lock current results
function lockResults() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    // Get current results
    const results = getFilteredResults(query);
    if (results.length === 0) return;
    
    // Add to locked filters
    lockedFilters.push({
        term: query,
        caseSensitive: caseSensitiveCheckbox.checked,
        wholeWord: wholeWordCheckbox.checked
    });
    
    // Update active scriptures to current results
    activeScriptures = results;
    
    // Clear search input
    searchInput.value = '';
    searchInput.placeholder = `Searching within ${activeScriptures.length.toLocaleString()} verses...`;
    
    // Update UI
    updateLockedFiltersDisplay();
    updateLockedResultsPreview();
    searchScriptures();
}

// Remove a locked filter
function removeLockAtIndex(index) {
    // Remove the filter
    lockedFilters.splice(index, 1);
    
    if (lockedFilters.length === 0) {
        // No filters left, reset to all scriptures
        activeScriptures = scriptures;
        searchInput.placeholder = 'Start typing to search all scriptures...';
    } else {
        // Rebuild active scriptures from remaining filters
        activeScriptures = scriptures;
        for (const filter of lockedFilters) {
            activeScriptures = filterScriptures(activeScriptures, filter.term, filter.caseSensitive, filter.wholeWord);
        }
        searchInput.placeholder = `Searching within ${activeScriptures.length.toLocaleString()} verses...`;
    }
    
    updateLockedFiltersDisplay();
    updateLockedResultsPreview();
    searchScriptures();
}

// Update locked results preview
function updateLockedResultsPreview(currentQuery = '') {
    if (lockedFilters.length === 0) {
        lockedResultsPreview.style.display = 'none';
        currentSearchHeader.style.display = 'none';
        return;
    }
    
    lockedResultsPreview.style.display = 'block';
    currentSearchHeader.style.display = 'block';
    
    // Filter locked results by current query if one exists
    let displaySet = activeScriptures;
    if (currentQuery.trim()) {
        displaySet = filterScriptures(activeScriptures, currentQuery.trim(), caseSensitiveCheckbox.checked, wholeWordCheckbox.checked);
    }
    
    // Show filtered locked results (limit for performance)
    const maxPreview = 200;
    const displayResults = displaySet.slice(0, maxPreview);
    
    // Highlight all locked filter terms plus current query
    const html = displayResults.map(scripture => {
        let referenceText = scripture.reference;
        let verseText = scripture.text;
        
        // Apply highlighting for each locked filter
        lockedFilters.forEach(filter => {
            referenceText = highlightText(referenceText, filter.term, filter.caseSensitive, filter.wholeWord);
            verseText = highlightText(verseText, filter.term, filter.caseSensitive, filter.wholeWord);
        });
        
        // Also highlight current search term if it exists
        if (currentQuery.trim()) {
            referenceText = highlightText(referenceText, currentQuery.trim(), caseSensitiveCheckbox.checked, wholeWordCheckbox.checked);
            verseText = highlightText(verseText, currentQuery.trim(), caseSensitiveCheckbox.checked, wholeWordCheckbox.checked);
        }
        
        const isLocked = isVerseLocked(scripture);
        const isFavorite = isVerseFavorite(scripture);
        
        return `
            <div class="result-item">
                <div class="result-content">
                    <div class="reference">${referenceText}</div>
                    <div class="verse-text">${verseText}</div>
                </div>
                <div class="verse-actions">
                    <button class="verse-action-btn ${isLocked ? 'active' : ''}" 
                            onclick='toggleLockedVerse(${JSON.stringify(scripture)})' 
                            title="${isLocked ? 'Unlock verse' : 'Lock verse in view'}">
                        ${isLocked ? '🔓' : '📌'}
                    </button>
                    <button class="verse-action-btn ${isFavorite ? 'active' : ''}" 
                            onclick='toggleFavoriteVerse(${JSON.stringify(scripture)})' 
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    const moreText = displaySet.length > maxPreview 
        ? `<div style="text-align: center; padding: 15px; color: #999; font-style: italic;">+ ${(displaySet.length - maxPreview).toLocaleString()} more verses</div>` 
        : '';
    
    const countText = currentQuery.trim() 
        ? `<div style="text-align: center; padding: 10px; color: #667eea; font-weight: 500; border-bottom: 1px solid #e0e0e0; margin-bottom: 10px;">${displaySet.length.toLocaleString()} of ${activeScriptures.length.toLocaleString()} locked verses match</div>`
        : '';
    
    lockedResultsContent.innerHTML = countText + html + moreText;
}

// Toggle locked results preview
function togglePreview() {
    previewCollapsed = !previewCollapsed;
    if (previewCollapsed) {
        lockedResultsContent.classList.add('collapsed');
        togglePreviewButton.textContent = '▶ Show';
    } else {
        lockedResultsContent.classList.remove('collapsed');
        togglePreviewButton.textContent = '▼ Hide';
    }
}

// Update locked filters display
function updateLockedFiltersDisplay() {
    if (lockedFilters.length === 0) {
        lockedFiltersDiv.style.display = 'none';
        return;
    }
    
    lockedFiltersDiv.style.display = 'block';
    lockedFiltersDiv.innerHTML = lockedFilters.map((filter, index) => `
        <span class="filter-tag">
            🔒 "${escapeHtml(filter.term)}"
            ${filter.caseSensitive ? '(Aa)' : ''}
            ${filter.wholeWord ? '(whole)' : ''}
            <span class="remove" onclick="removeLockAtIndex(${index})" title="Remove this filter">×</span>
        </span>
    `).join('');
}

// Filter scriptures based on search criteria
function filterScriptures(scriptureSet, searchTerm, caseSensitive, wholeWord) {
    const searchLower = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    
    // Apply text search
    let results;
    if (wholeWord) {
        const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseSensitive ? '' : 'i');
        results = scriptureSet.filter(scripture => {
            const fullText = `${scripture.reference} ${scripture.text}`;
            return regex.test(fullText);
        });
    } else {
        results = scriptureSet.filter(scripture => {
            const fullText = `${scripture.reference} ${scripture.text}`;
            const compareText = caseSensitive ? fullText : fullText.toLowerCase();
            return compareText.includes(searchLower);
        });
    }
    
    // Apply volume filters
    return applyVolumeFilters(results);
}

// Apply volume filters to scripture set
function applyVolumeFilters(scriptureSet) {
    // Check if volume filters are initialized
    if (!volumeFilters.bible || !volumeFilters.bom || !volumeFilters.dc || !volumeFilters.pgp) {
        return scriptureSet;
    }
    
    const enabledVolumes = [];
    if (volumeFilters.bible.checked) enabledVolumes.push('bible');
    if (volumeFilters.bom.checked) enabledVolumes.push('bom');
    if (volumeFilters.dc.checked) enabledVolumes.push('dc');
    if (volumeFilters.pgp.checked) enabledVolumes.push('pgp');
    
    // If all or none are checked, show everything
    if (enabledVolumes.length === 0 || enabledVolumes.length === 4) {
        return scriptureSet;
    }
    
    return scriptureSet.filter(scripture => enabledVolumes.includes(scripture.volume));
}

// Get filtered results without modifying state
function getFilteredResults(searchTerm) {
    if (!searchTerm) {
        return applyVolumeFilters(activeScriptures);
    }
    return filterScriptures(activeScriptures, searchTerm, caseSensitiveCheckbox.checked, wholeWordCheckbox.checked);
}

// Search scriptures
function searchScriptures() {
    const query = searchInput.value;
    const caseSensitive = caseSensitiveCheckbox.checked;
    const wholeWord = wholeWordCheckbox.checked;
    const maxResults = parseInt(maxResultsSelect.value);
    
    // Update locked results preview with current query
    updateLockedResultsPreview(query);
    
    if (!query) {
        const baseCount = activeScriptures.length;
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">Start typing to search ${baseCount.toLocaleString()} verses</div>
            </div>
        `;
        const baseText = lockedFilters.length > 0 ? 'filtered verses' : 'verses loaded';
        statsDiv.textContent = `${baseCount.toLocaleString()} ${baseText}. Start typing to search!`;
        lockButton.style.display = 'none';
        currentSearchHeader.style.display = lockedFilters.length > 0 ? 'block' : 'none';
        return;
    }
    
    // Show current search header when we have locked filters
    currentSearchHeader.style.display = lockedFilters.length > 0 ? 'block' : 'none';
    
    const startTime = performance.now();
    
    // Prepare search term
    const searchTerm = query.trim();
    
    // Filter scriptures from active set
    const results = getFilteredResults(searchTerm);
    
    // Count total occurrences
    let totalOccurrences = 0;
    if (wholeWord) {
        const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseSensitive ? 'g' : 'gi');
        results.forEach(scripture => {
            const fullText = `${scripture.reference} ${scripture.text}`;
            const matches = fullText.match(regex);
            if (matches) totalOccurrences += matches.length;
        });
    } else {
        const searchFor = caseSensitive ? searchTerm : searchTerm.toLowerCase();
        results.forEach(scripture => {
            const fullText = `${scripture.reference} ${scripture.text}`;
            const compareText = caseSensitive ? fullText : fullText.toLowerCase();
            let pos = 0;
            while ((pos = compareText.indexOf(searchFor, pos)) !== -1) {
                totalOccurrences++;
                pos += searchFor.length;
            }
        });
    }
    
    const endTime = performance.now();
    const searchTime = (endTime - startTime).toFixed(2);
    
    // Update stats
    const displayCount = Math.min(results.length, maxResults);
    const baseInfo = lockedFilters.length > 0 ? ` (within ${activeScriptures.length.toLocaleString()} locked)` : '';
    const resultText = totalOccurrences === results.length 
        ? `${results.length.toLocaleString()} results`
        : `${totalOccurrences.toLocaleString()} results in ${results.length.toLocaleString()} verses`;
    statsDiv.innerHTML = `
        <span>Found ${resultText}${baseInfo} in ${searchTime}ms</span>
        <span>${displayCount < results.length ? `Showing first ${displayCount.toLocaleString()}` : ''}</span>
    `;
    
    // Show/hide lock button
    lockButton.style.display = results.length > 0 ? 'block' : 'none';
    
    // Display results
    if (results.length === 0) {
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📖</div>
                <div class="empty-state-text">No verses found matching "${escapeHtml(query)}"</div>
            </div>
        `;
    } else {
        const html = results.slice(0, maxResults).map(scripture => {
            const isLocked = isVerseLocked(scripture);
            const isFavorite = isVerseFavorite(scripture);
            return `
            <div class="result-item">
                <div class="result-content">
                    <div class="reference">${highlightText(scripture.reference, searchTerm, caseSensitive, wholeWord)}</div>
                    <div class="verse-text">${highlightText(scripture.text, searchTerm, caseSensitive, wholeWord)}</div>
                </div>
                <div class="verse-actions">
                    <button class="verse-action-btn ${isLocked ? 'active' : ''}" 
                            onclick='toggleLockedVerse(${JSON.stringify(scripture)})' 
                            title="${isLocked ? 'Unlock verse' : 'Lock verse in view'}">
                        ${isLocked ? '🔓' : '📌'}
                    </button>
                    <button class="verse-action-btn ${isFavorite ? 'active' : ''}" 
                            onclick='toggleFavoriteVerse(${JSON.stringify(scripture)})' 
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        resultsDiv.innerHTML = html;
        resultsDiv.scrollTop = 0;
    }
}

// Make removeLockAtIndex globally accessible
window.removeLockAtIndex = removeLockAtIndex;

// ===== LOCKED VERSES FUNCTIONALITY =====

function createVerseKey(scripture) {
    return `${scripture.reference}|||${scripture.text}`;
}

function parseVerseKey(key) {
    const [reference, text] = key.split('|||');
    const bookName = extractBookName(reference);
    return {
        reference,
        text,
        volume: getVolumeForBook(bookName)
    };
}

function isVerseLocked(scripture) {
    const key = createVerseKey(scripture);
    return lockedVerses.some(v => createVerseKey(v) === key);
}

function toggleLockedVerse(scripture) {
    const key = createVerseKey(scripture);
    const index = lockedVerses.findIndex(v => createVerseKey(v) === key);
    
    if (index >= 0) {
        lockedVerses.splice(index, 1);
    } else {
        lockedVerses.push(scripture);
    }
    
    updateLockedVersesDisplay();
    searchScriptures();
}

function removeLockedVerse(index) {
    lockedVerses.splice(index, 1);
    updateLockedVersesDisplay();
    searchScriptures();
}

function clearAllLockedVerses() {
    if (lockedVerses.length === 0) return;
    if (confirm('Clear all locked verses?')) {
        lockedVerses = [];
        updateLockedVersesDisplay();
        searchScriptures();
    }
}

function updateLockedVersesDisplay() {
    if (lockedVerses.length === 0) {
        lockedVersesSection.style.display = 'none';
        return;
    }
    
    lockedVersesSection.style.display = 'block';
    lockedVersesList.innerHTML = lockedVerses.map((verse, index) => `
        <div class="locked-verse-item">
            <div class="verse-item-content">
                <div class="reference">${escapeHtml(verse.reference)}</div>
                <div class="verse-text">${escapeHtml(verse.text)}</div>
            </div>
            <div class="verse-item-actions">
                <button class="remove-verse-btn" onclick="removeLockedVerse(${index})" title="Remove">×</button>
            </div>
        </div>
    `).join('');
}

// ===== FAVORITES FUNCTIONALITY =====

function loadFavorites() {
    try {
        const saved = localStorage.getItem('scriptureSearchFavorites');
        if (saved) {
            const keys = JSON.parse(saved);
            favoriteVerses = keys.map(parseVerseKey);
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

function saveFavorites() {
    try {
        const keys = favoriteVerses.map(createVerseKey);
        localStorage.setItem('scriptureSearchFavorites', JSON.stringify(keys));
    } catch (error) {
        console.error('Error saving favorites:', error);
    }
}

function isVerseFavorite(scripture) {
    const key = createVerseKey(scripture);
    return favoriteVerses.some(v => createVerseKey(v) === key);
}

function toggleFavoriteVerse(scripture) {
    const key = createVerseKey(scripture);
    const index = favoriteVerses.findIndex(v => createVerseKey(v) === key);
    
    if (index >= 0) {
        favoriteVerses.splice(index, 1);
    } else {
        favoriteVerses.push(scripture);
    }
    
    saveFavorites();
    updateFavoritesDisplay();
    searchScriptures();
}

function removeFavoriteVerse(index) {
    favoriteVerses.splice(index, 1);
    saveFavorites();
    updateFavoritesDisplay();
    searchScriptures();
}

function clearAllFavorites() {
    if (favoriteVerses.length === 0) return;
    if (confirm('Clear all favorite verses?')) {
        favoriteVerses = [];
        saveFavorites();
        updateFavoritesDisplay();
        searchScriptures();
    }
}

function exportFavorites() {
    if (favoriteVerses.length === 0) {
        alert('No favorite verses to export.');
        return;
    }
    
    const text = favoriteVerses.map(verse => `${verse.reference}\n${verse.text}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favorite-scriptures-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateFavoritesDisplay() {
    if (favoriteVerses.length === 0) {
        favoritesSection.style.display = 'none';
        return;
    }
    
    favoritesSection.style.display = 'block';
    favoritesList.innerHTML = favoriteVerses.map((verse, index) => `
        <div class="favorite-verse-item">
            <div class="verse-item-content">
                <div class="reference">${escapeHtml(verse.reference)}</div>
                <div class="verse-text">${escapeHtml(verse.text)}</div>
            </div>
            <div class="verse-item-actions">
                <button class="remove-verse-btn" onclick="removeFavoriteVerse(${index})" title="Remove">×</button>
            </div>
        </div>
    `).join('');
}

// Make functions globally accessible
window.removeLockedVerse = removeLockedVerse;
window.removeFavoriteVerse = removeFavoriteVerse;
window.toggleLockedVerse = toggleLockedVerse;
window.toggleFavoriteVerse = toggleFavoriteVerse;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    searchInput = document.getElementById('searchInput');
    statsDiv = document.getElementById('stats');
    resultsDiv = document.getElementById('results');
    caseSensitiveCheckbox = document.getElementById('caseSensitive');
    wholeWordCheckbox = document.getElementById('wholeWord');
    maxResultsSelect = document.getElementById('maxResults');
    lockButton = document.getElementById('lockButton');
    lockedFiltersDiv = document.getElementById('lockedFilters');
    lockedResultsPreview = document.getElementById('lockedResultsPreview');
    lockedResultsContent = document.getElementById('lockedResultsContent');
    currentSearchHeader = document.getElementById('currentSearchHeader');
    togglePreviewButton = document.getElementById('togglePreview');
    
    // Locked verses and favorites elements
    lockedVersesSection = document.getElementById('lockedVersesSection');
    lockedVersesList = document.getElementById('lockedVersesList');
    favoritesSection = document.getElementById('favoritesSection');
    favoritesList = document.getElementById('favoritesList');
    
    // Volume filters
    volumeFilters.bible = document.getElementById('filterBible');
    volumeFilters.bom = document.getElementById('filterBoM');
    volumeFilters.dc = document.getElementById('filterDC');
    volumeFilters.pgp = document.getElementById('filterPGP');
    
    searchInput.disabled = true;
    
    // Event listeners
    searchInput.addEventListener('input', searchScriptures);
    caseSensitiveCheckbox.addEventListener('change', searchScriptures);
    wholeWordCheckbox.addEventListener('change', searchScriptures);
    maxResultsSelect.addEventListener('change', searchScriptures);
    lockButton.addEventListener('click', lockResults);
    togglePreviewButton.addEventListener('click', togglePreview);
    
    // Locked verses and favorites event listeners
    document.getElementById('clearLockedVerses').addEventListener('click', clearAllLockedVerses);
    document.getElementById('clearFavorites').addEventListener('click', clearAllFavorites);
    document.getElementById('exportFavorites').addEventListener('click', exportFavorites);
    
    // Volume filter listeners
    document.querySelectorAll('.volume-filter').forEach(checkbox => {
        checkbox.addEventListener('change', searchScriptures);
    });
    
    // Show loading state
    resultsDiv.innerHTML = `
        <div class="loading">
            Loading ${(6.7).toFixed(1)} MB of scriptures...
        </div>
    `;
    
    // Load favorites from localStorage
    loadFavorites();
    updateFavoritesDisplay();
    
    // Load scriptures
    loadScriptures();
});
