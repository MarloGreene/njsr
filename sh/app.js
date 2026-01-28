// LDS Scripture Highlighter Application v1.0
//
// Features:
// - Multi-column scripture view with minimal chapter/verse markings
// - Click/drag to highlight verses or phrases, with color cycling
// - Customizable palette, import/export, persistent localStorage
// - Search with instant filtering and bulk highlighting
// - Four themes: light, dark, sepia (aged paper), night (OLED)
// - Position memory across page refreshes
// - Responsive, accessible, privacy-focused, no frameworks
//
// Security: XSS-safe rendering, validated imports, safe localStorage
// Main entry: ScriptureApp class (instantiated on DOMContentLoaded)
//
// MIT License - For details, see README.md
class ScriptureApp {
    constructor() {
        // DOM element cache
        this.elements = {
            app: document.getElementById('app'),
            volumeSelect: document.getElementById('volumeSelect'),
            bookSelect: document.getElementById('bookSelect'),
            chapterSelect: document.getElementById('chapterSelect'),
            verseSelect: document.getElementById('verseSelect'),
            prevPageBtn: document.getElementById('prevPageBtn'),
            nextPageBtn: document.getElementById('nextPageBtn'),
            pageIndicator: document.getElementById('pageIndicator'),
            paletteColors: document.getElementById('paletteColors'),
            resetColorsBtn: document.getElementById('resetColorsBtn'),
            exportBtn: document.getElementById('exportBtn'),
            importBtn: document.getElementById('importBtn'),
            clearBtn: document.getElementById('clearBtn'),
            contentArea: document.getElementById('contentArea'),
            decreaseFontBtn: document.getElementById('decreaseFontBtn'),
            increaseFontBtn: document.getElementById('increaseFontBtn'),
            fontSizeDisplay: document.getElementById('fontSizeDisplay'),
            decreaseColumnsBtn: document.getElementById('decreaseColumnsBtn'),
            increaseColumnsBtn: document.getElementById('increaseColumnsBtn'),
            columnCountDisplay: document.getElementById('columnCountDisplay'),
            importModal: document.getElementById('importModal'),
            closeImportBtn: document.getElementById('closeImportBtn'),
            cancelImportBtn: document.getElementById('cancelImportBtn'),
            confirmImportBtn: document.getElementById('confirmImportBtn'),
            importTextarea: document.getElementById('importTextarea'),
            importFileInput: document.getElementById('importFileInput'),
            importFileBtn: document.getElementById('importFileBtn'),
            searchInput: document.getElementById('searchInput'),
            searchCount: document.getElementById('searchCount'),
            highlightPhrasesBtn: document.getElementById('highlightPhrasesBtn'),
            highlightVersesBtn: document.getElementById('highlightVersesBtn'),
            clearSearchBtn: document.getElementById('clearSearchBtn'),
            dragHighlightBtn: document.getElementById('dragHighlightBtn'),
            dragBoxBtn: document.getElementById('dragBoxBtn'),
            undoBtn: document.getElementById('undoBtn')
        };

        // Search state
        this.searchTerm = '';
        this.searchResults = [];

        // Data - lazy loaded by volume
        this.scriptures = [];
        this.scripturesByVolume = {}; // Cache: { 'Book of Mormon': [...], ... }
        this.loadedVolumes = new Set();
        this.volumeFiles = {
            'Book of Mormon': 'bom.txt',
            'Doctrine and Covenants': 'dnc.txt',
            'Old Testament': 'kjv.txt',
            'New Testament': 'kjv.txt', // Both in same file, filtered by volume
            'Pearl of Great Price': 'pogp.txt'
        };
        this.highlights = {};
        this.phraseHighlights = {};
        this.undoHistory = [];
        this.maxUndoHistory = 50;
        this.highlightApplyMode = 'cycle'; // 'cycle' or 'direct'
        this.dragMode = 'highlight'; // 'highlight' or 'box'
        this.activeHighlightColorIndex = 0;
        this.currentCycleIndex = 0;
        this.settings = {
            columnCount: 3,
            fontSize: 16,
            highlightColors: ['#c3e6cb', '#fff3cd', '#f8d7da', '#e2d9f3'],
            theme: 'sepia'
        };
        this.position = {
            page: 0,
            volume: '',
            book: '',
            chapter: '',
            verse: ''
        };
        this.currentPage = 0;
        this.filteredScriptures = [];
        this.filters = {
            volume: '',
            book: '',
            chapter: '',
            verse: ''
        };
        // Drag detection
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragThreshold = 5; // pixels
        this.shouldTriggerCycleAnimation = false;

        // Pagination cache
        this.pageBreaks = [0];
        this.pageBreakSettingsKey = null;
        this.preCalcInProgress = false;

        this.init();
    }

    async init() {
        this.loadSettings();
        this.loadHighlights();
        this.loadPosition();
        this.applyTheme();
        this.setupEventListeners();
        this.renderPalette();
        this.updateHighlightStyles();
        this.updateModeUI();
        this.updateUndoButton();
        await this.loadScriptures();
        await this.restorePosition();
        this.renderPage();
    }

    // Update drag mode button states
    updateModeUI() {
        // Update drag mode buttons
        if (this.elements.dragHighlightBtn && this.elements.dragBoxBtn) {
            this.elements.dragHighlightBtn.classList.toggle('active', this.dragMode === 'highlight');
            this.elements.dragBoxBtn.classList.toggle('active', this.dragMode === 'box');
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    isValidHexColor(color) {
        return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
    }

    isDarkColor(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(x => x + x).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
    }

    getUsedHighlightColors() {
        const used = new Set();
        Object.values(this.highlights).forEach(h => used.add(h.color));
        Object.values(this.phraseHighlights).forEach(arr => arr.forEach(p => used.add(p.color)));
        return Array.from(used);
    }

    getHighlightUsageByColor() {
        const usage = {};
        Object.values(this.highlights).forEach(h => {
            usage[h.color] = usage[h.color] || { verses: 0, phrases: 0 };
            usage[h.color].verses++;
        });
        Object.values(this.phraseHighlights).forEach(arr => arr.forEach(p => {
            usage[p.color] = usage[p.color] || { verses: 0, phrases: 0 };
            usage[p.color].phrases++;
        }));
        return usage;
    }

    getOrphanedColors() {
        const usedColors = this.getUsedHighlightColors();
        return usedColors.filter(color =>
            color !== '#ff00ff' &&
            this.isValidHexColor(color) &&
            !this.settings.highlightColors.includes(color)
        );
    }

    showToast(message) {
        let toast = document.getElementById('sh-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'sh-toast';
            toast.className = 'sh-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 1200);
    }

    // Undo functionality
    saveUndoState() {
        const state = {
            highlights: JSON.parse(JSON.stringify(this.highlights)),
            phraseHighlights: JSON.parse(JSON.stringify(this.phraseHighlights))
        };
        this.undoHistory.push(state);
        if (this.undoHistory.length > this.maxUndoHistory) {
            this.undoHistory.shift();
        }
        this.updateUndoButton();
    }

    undo() {
        if (this.undoHistory.length === 0) {
            this.showToast('Nothing to undo');
            return;
        }
        const state = this.undoHistory.pop();
        this.highlights = state.highlights;
        this.phraseHighlights = state.phraseHighlights;
        this.saveHighlights();
        this.renderPage();
        this.updateUndoButton();
        this.showToast('Undone!');
    }

    updateUndoButton() {
        if (this.elements.undoBtn) {
            this.elements.undoBtn.disabled = this.undoHistory.length === 0;
            this.elements.undoBtn.style.opacity = this.undoHistory.length === 0 ? '0.5' : '1';
        }
    }

    // Settings and data management
    loadSettings() {
        try {
            const saved = localStorage.getItem('scriptureSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    this.settings = { ...this.settings, ...parsed };
                }
            }
        } catch (e) {
            console.warn('Failed to load settings from localStorage:', e);
        }
        this.applySettings();
    }

    saveSettings() {
        try {
            localStorage.setItem('scriptureSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    applySettings() {
        this.elements.fontSizeDisplay.textContent = `${this.settings.fontSize}px`;
        this.elements.columnCountDisplay.textContent = this.settings.columnCount;
        this.elements.contentArea.style.fontSize = `${this.settings.fontSize}px`;
    }

    // Pagination with lazy page-break calculation
    // pageBreaks[n] = starting verse index for page n
    // We calculate these on-demand by measuring actual rendered content

    clearPageBreakCache() {
        this.pageBreaks = [0]; // Page 0 always starts at verse 0
        this.pageBreakSettingsKey = null;
        this.preCalcInProgress = false;
    }

    getSettingsKey() {
        return `${this.settings.fontSize}-${this.settings.columnCount}-${window.innerWidth}-${window.innerHeight}`;
    }

    ensurePageBreakCache() {
        const key = this.getSettingsKey();
        if (this.pageBreakSettingsKey !== key) {
            this.clearPageBreakCache();
            this.pageBreakSettingsKey = key;
        }
    }

    // Pre-calculate all page breaks in background for instant navigation
    preCalculatePageBreaks() {
        if (this.preCalcInProgress) return;
        this.preCalcInProgress = true;

        const verses = this.getFilteredVersesForDisplay();
        if (verses.length === 0) {
            this.preCalcInProgress = false;
            return;
        }

        const calculateNextBatch = () => {
            // Check if settings changed (invalidates our work)
            if (this.pageBreakSettingsKey !== this.getSettingsKey()) {
                this.preCalcInProgress = false;
                return;
            }

            const lastPageStart = this.pageBreaks[this.pageBreaks.length - 1];
            if (lastPageStart >= verses.length) {
                // Done - all pages calculated
                this.preCalcInProgress = false;
                this.updatePageIndicator(); // Update to show exact count
                return;
            }

            // Calculate a few pages per frame to avoid blocking UI
            for (let i = 0; i < 3; i++) {
                const currentLast = this.pageBreaks[this.pageBreaks.length - 1];
                if (currentLast >= verses.length) break;

                const nextPageStart = this.measurePageContent(verses, currentLast);
                if (nextPageStart <= currentLast) {
                    this.pageBreaks.push(currentLast + 1);
                } else {
                    this.pageBreaks.push(nextPageStart);
                }
            }

            // Continue in next animation frame
            requestAnimationFrame(calculateNextBatch);
        };

        // Start after a short delay to let initial render complete
        setTimeout(() => requestAnimationFrame(calculateNextBatch), 100);
    }

    // Find how many verses fit on a page starting from startIndex
    measurePageContent(verses, startIndex) {
        const contentArea = this.elements.contentArea;
        const container = document.createElement('div');
        container.className = `scripture-columns cols-${this.settings.columnCount}`;
        container.style.visibility = 'hidden';
        // Note: scripture-columns CSS already has position:absolute and insets
        // We just need to hide it during measurement

        contentArea.appendChild(container);

        // Get container dimensions - ensure we have a valid height
        const maxHeight = container.offsetHeight;
        if (maxHeight <= 0) {
            contentArea.removeChild(container);
            // Fallback: estimate ~20 verses per page if measurement fails
            return Math.min(startIndex + 20, verses.length);
        }

        let lastSafeIndex = startIndex;

        // Initialize context from previous verse (same as renderCurrentPage)
        let currentBook = '';
        let currentChapter = '';
        if (startIndex > 0 && startIndex <= verses.length) {
            const prevVerse = verses[startIndex - 1];
            currentBook = prevVerse.book;
            currentChapter = String(prevVerse.chapter);
        }

        // Add verses until we overflow
        const maxVersesToCheck = Math.min(verses.length - startIndex, 200);

        for (let i = 0; i < maxVersesToCheck; i++) {
            const verseIdx = startIndex + i;
            if (verseIdx >= verses.length) break;

            const verse = verses[verseIdx];

            // Build HTML for this verse (with headings if needed) - must match renderCurrentPage logic
            let html = '';
            if (verse.book !== currentBook) {
                html += `<div class="chapter-heading book-heading">${this.escapeHtml(verse.book)}</div>`;
                currentBook = verse.book;
                currentChapter = ''; // Reset to force chapter heading
            }
            if (String(verse.chapter) !== currentChapter) {
                html += `<div class="chapter-heading">Chapter ${verse.chapter}</div>`;
                currentChapter = String(verse.chapter);
            }

            const highlightClass = this.getHighlightClass(verse.reference);
            const highlightStyle = this.getHighlightStyle(verse.reference);
            const styleAttr = highlightStyle ? ` style="${highlightStyle}"` : '';
            const escapedRef = verse.reference.replace(/"/g, '&quot;');
            // Skip phrase highlights during measurement for speed
            const verseContent = this.escapeHtml(verse.text);
            html += `<span class="verse ${highlightClass}"${styleAttr} data-ref="${escapedRef}">`;
            html += `<sup class="verse-ref">${verse.verse}</sup>`;
            html += verseContent;
            html += '</span>';

            // Use insertAdjacentHTML instead of innerHTML += (much faster)
            container.insertAdjacentHTML('beforeend', html);

            // Check if we've overflowed - for multi-column, check if last element is outside bounds
            const lastElement = container.lastElementChild;
            if (lastElement) {
                const rect = lastElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                // Check if element extends beyond container (either vertically or horizontally)
                if (rect.bottom > containerRect.bottom || rect.right > containerRect.right) {
                    // This verse caused overflow - previous was the last safe
                    break;
                }
            }

            lastSafeIndex = verseIdx + 1; // +1 because this is the END index (exclusive)
        }

        contentArea.removeChild(container);

        // Return the end index (exclusive) - at least 1 verse per page
        return Math.max(lastSafeIndex, startIndex + 1);
    }

    getPageStartIndex(pageNum) {
        this.ensurePageBreakCache();

        const verses = this.getFilteredVersesForDisplay();

        // Calculate page breaks up to the requested page
        while (this.pageBreaks.length <= pageNum) {
            const lastPageStart = this.pageBreaks[this.pageBreaks.length - 1];
            if (lastPageStart >= verses.length) {
                // No more content
                break;
            }
            const nextPageStart = this.measurePageContent(verses, lastPageStart);
            if (nextPageStart <= lastPageStart) {
                // Safety: ensure progress
                this.pageBreaks.push(lastPageStart + 1);
            } else {
                this.pageBreaks.push(nextPageStart);
            }
        }

        if (pageNum < this.pageBreaks.length) {
            return this.pageBreaks[pageNum];
        }
        return verses.length; // Past the end
    }

    getFilteredVersesForDisplay() {
        let verses = this.filteredScriptures;
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            verses = verses.filter(v => v.text.toLowerCase().includes(term));
        }
        return verses;
    }

    getTotalPages() {
        // Estimate total pages based on known page breaks
        this.ensurePageBreakCache();
        const verses = this.getFilteredVersesForDisplay();
        if (verses.length === 0) return 1;

        // If we've calculated all breaks, we know exactly
        const lastKnownStart = this.pageBreaks[this.pageBreaks.length - 1];
        if (lastKnownStart >= verses.length) {
            return this.pageBreaks.length - 1; // Last entry is past-end marker
        }

        // Estimate: assume remaining pages have similar verse count as calculated ones
        if (this.pageBreaks.length > 1) {
            const avgVersesPerPage = lastKnownStart / (this.pageBreaks.length - 1);
            const remainingVerses = verses.length - lastKnownStart;
            const estimatedRemainingPages = Math.ceil(remainingVerses / avgVersesPerPage);
            return this.pageBreaks.length - 1 + estimatedRemainingPages;
        }

        // Fallback estimate
        return Math.max(1, Math.ceil(verses.length / 20));
    }

    updatePageIndicator() {
        const totalPages = this.getTotalPages();
        if (this.searchTerm) {
            const matchCount = this.getFilteredVersesForDisplay().length;
            this.elements.pageIndicator.textContent = `${this.currentPage + 1}/~${totalPages} (${matchCount} matches)`;
        } else {
            this.elements.pageIndicator.textContent = `Page ${this.currentPage + 1} of ~${totalPages}`;
        }
    }

    goToPage(pageNum) {
        const verses = this.getFilteredVersesForDisplay();
        if (verses.length === 0) {
            this.currentPage = 0;
            this.renderCurrentPage();
            return;
        }

        // Clamp to valid range
        this.currentPage = Math.max(0, pageNum);

        // Check if this page has content
        const startIdx = this.getPageStartIndex(this.currentPage);
        if (startIdx >= verses.length && this.currentPage > 0) {
            // Past the end, go to last valid page
            this.currentPage = Math.max(0, this.pageBreaks.length - 2);
        }

        this.renderCurrentPage();
        if (!this.searchTerm) this.savePosition();
    }

    getDisplayedVerseCount() {
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            return this.filteredScriptures.filter(verse =>
                verse.text.toLowerCase().includes(term)
            ).length;
        }
        return this.filteredScriptures.length;
    }

    loadHighlights() {
        try {
            const saved = localStorage.getItem('scriptureHighlights');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    this.highlights = parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load highlights from localStorage:', e);
        }
        try {
            const savedPhrases = localStorage.getItem('scripturePhraseHighlights');
            if (savedPhrases) {
                const parsed = JSON.parse(savedPhrases);
                if (parsed && typeof parsed === 'object') {
                    this.phraseHighlights = parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load phrase highlights from localStorage:', e);
        }
    }

    saveHighlights() {
        try {
            localStorage.setItem('scriptureHighlights', JSON.stringify(this.highlights));
            localStorage.setItem('scripturePhraseHighlights', JSON.stringify(this.phraseHighlights));
        } catch (e) {
            console.warn('Failed to save highlights:', e);
            this.showToast('Storage full - could not save highlights');
        }
    }

    // Position persistence
    loadPosition() {
        try {
            const saved = localStorage.getItem('scripturePosition');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    this.position = { ...this.position, ...parsed };
                }
            }
        } catch (e) {
            console.warn('Failed to load position from localStorage:', e);
        }
    }

    savePosition() {
        this.position = {
            page: this.currentPage,
            volume: this.filters.volume,
            book: this.filters.book,
            chapter: this.filters.chapter,
            verse: this.filters.verse
        };
        try {
            localStorage.setItem('scripturePosition', JSON.stringify(this.position));
        } catch (e) {
            console.warn('Failed to save position:', e);
        }
    }

    async restorePosition() {
        // Load the saved volume first if different from default
        if (this.position.volume && this.position.volume !== 'Book of Mormon') {
            await this.loadVolume(this.position.volume);
        } else if (!this.position.volume) {
            // "All Volumes" was saved - load all
            await this.loadAllVolumes();
        }

        // Restore filters
        if (this.position.volume) {
            this.filters.volume = this.position.volume;
            this.elements.volumeSelect.value = this.position.volume;
        } else {
            this.filters.volume = '';
            this.elements.volumeSelect.value = '';
        }
        this.updateBookFilter();

        if (this.position.book) {
            this.filters.book = this.position.book;
            this.elements.bookSelect.value = this.position.book;
            this.updateChapterFilter();
        }
        if (this.position.chapter) {
            this.filters.chapter = this.position.chapter;
            this.elements.chapterSelect.value = this.position.chapter;
            this.updateVerseFilter();
        }
        if (this.position.verse) {
            this.filters.verse = this.position.verse;
            this.elements.verseSelect.value = this.position.verse;
        }

        // Apply filters and restore page (will be clamped after render/measure)
        this.applyFilters();
        this.currentPage = this.position.page || 0;
    }

    // Theme handling
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        // Update theme button active states
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });
    }

    setTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
        this.applyTheme();
    }

    // Scripture loading and parsing - lazy load by volume
    async loadScriptures() {
        // Just populate volume dropdown, load default volume
        this.populateVolumeFilter();
        // Default to Book of Mormon (smaller, faster initial load)
        await this.loadVolume('Book of Mormon');
        this.filters.volume = 'Book of Mormon';
        this.elements.volumeSelect.value = 'Book of Mormon';
        this.updateBookFilter();
        this.applyFilters();
    }

    populateVolumeFilter() {
        const volumes = ['Old Testament', 'New Testament', 'Book of Mormon', 'Doctrine and Covenants', 'Pearl of Great Price'];
        this.elements.volumeSelect.innerHTML = '<option value="">All Volumes</option>';
        volumes.forEach(vol => {
            const option = document.createElement('option');
            option.value = vol;
            option.textContent = vol;
            this.elements.volumeSelect.appendChild(option);
        });
    }

    async loadVolume(volume) {
        if (this.loadedVolumes.has(volume)) {
            return; // Already loaded
        }

        const file = this.volumeFiles[volume];
        if (!file) {
            console.error('Unknown volume:', volume);
            return;
        }

        try {
            this.elements.contentArea.innerHTML = `<div class="loading">Loading ${volume}...</div>`;
            const response = await fetch(file);
            const text = await response.text();
            const verses = text.split('\n')
                .filter(line => line.trim())
                .map(line => this.parseScriptureLine(line))
                .filter(item => item !== null)
                .filter(item => item.volume === volume); // Filter for exact volume (kjv.txt has both OT/NT)

            this.scripturesByVolume[volume] = verses;
            this.loadedVolumes.add(volume);

            // Rebuild combined scriptures array from all loaded volumes
            this.rebuildScripturesArray();
        } catch (error) {
            console.error(`Error loading ${volume}:`, error);
            this.elements.contentArea.innerHTML = `<div class="loading">Error loading ${volume}.</div>`;
        }
    }

    async loadAllVolumes() {
        const volumes = Object.keys(this.volumeFiles);
        for (const volume of volumes) {
            if (!this.loadedVolumes.has(volume)) {
                await this.loadVolume(volume);
            }
        }
    }

    rebuildScripturesArray() {
        // Combine all loaded volumes in canonical order
        const order = ['Old Testament', 'New Testament', 'Book of Mormon', 'Doctrine and Covenants', 'Pearl of Great Price'];
        this.scriptures = [];
        for (const vol of order) {
            if (this.scripturesByVolume[vol]) {
                this.scriptures.push(...this.scripturesByVolume[vol]);
            }
        }
    }

    parseScriptureLine(line) {
        const match = line.match(/^(.+?)\s{4,}(.+)$/);
        if (!match) return null;
        const ref = match[1].trim();
        const verseText = match[2].trim();
        const lastSpaceIndex = ref.lastIndexOf(' ');
        if (lastSpaceIndex === -1) return null;
        const book = ref.substring(0, lastSpaceIndex);
        const chapterVerse = ref.substring(lastSpaceIndex + 1);
        const colonIndex = chapterVerse.indexOf(':');
        if (colonIndex === -1) return null;
        const chapter = parseInt(chapterVerse.substring(0, colonIndex), 10);
        const verse = parseInt(chapterVerse.substring(colonIndex + 1), 10);
        if (isNaN(chapter) || isNaN(verse)) return null;
        return {
            reference: ref,
            book: book,
            chapter: chapter,
            verse: verse,
            text: verseText,
            volume: this.determineVolume(book)
        };
    }

    determineVolume(book) {
        const volumes = {
            'Old Testament': ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'],
            'New Testament': ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'],
            'Book of Mormon': ['1 Nephi', '2 Nephi', 'Jacob', 'Enos', 'Jarom', 'Omni', 'Words of Mormon', 'Mosiah', 'Alma', 'Helaman', '3 Nephi', '4 Nephi', 'Mormon', 'Ether', 'Moroni'],
            'Doctrine and Covenants': ['Doctrine and Covenants'],
            'Pearl of Great Price': ['Moses', 'Abraham', 'Joseph Smith—Matthew', 'Joseph Smith—History', 'Articles of Faith']
        };
        for (const [volume, books] of Object.entries(volumes)) {
            if (books.includes(book)) return volume;
        }
        return 'Unknown';
    }


    // Filtering
    updateBookFilter() {
        this.elements.bookSelect.innerHTML = '<option value="">All Books</option>';
        let books = this.scriptures;
        if (this.filters.volume) {
            books = books.filter(s => s.volume === this.filters.volume);
        }
        const uniqueBooks = [...new Set(books.map(s => s.book))];
        uniqueBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book;
            option.textContent = book;
            this.elements.bookSelect.appendChild(option);
        });
    }

    updateChapterFilter() {
        this.elements.chapterSelect.innerHTML = '<option value="">All Chapters</option>';
        if (!this.filters.book) return;
        const chapters = [...new Set(
            this.scriptures
                .filter(s => s.book === this.filters.book)
                .map(s => s.chapter)
        )].sort((a, b) => a - b);
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = chapter;
            this.elements.chapterSelect.appendChild(option);
        });
    }

    updateVerseFilter() {
        this.elements.verseSelect.innerHTML = '<option value="">All Verses</option>';
        if (!this.filters.book || !this.filters.chapter) return;
        const verses = this.scriptures
            .filter(s => s.book === this.filters.book && s.chapter === parseInt(this.filters.chapter, 10))
            .map(s => s.verse)
            .sort((a, b) => a - b);
        verses.forEach(verse => {
            const option = document.createElement('option');
            option.value = verse;
            option.textContent = verse;
            this.elements.verseSelect.appendChild(option);
        });
    }

    applyFilters() {
        this.filteredScriptures = this.scriptures.filter(scripture => {
            if (this.filters.volume && scripture.volume !== this.filters.volume) return false;
            if (this.filters.book && scripture.book !== this.filters.book) return false;
            if (this.filters.chapter && scripture.chapter !== parseInt(this.filters.chapter, 10)) return false;
            if (this.filters.verse && scripture.verse !== parseInt(this.filters.verse, 10)) return false;
            return true;
        });
        this.currentPage = 0;
        this.clearPageBreakCache();
    }

    // Rendering - only renders the current page's content
    renderPage() {
        this.ensurePageBreakCache();
        this.renderCurrentPage();
        // Pre-calculate remaining page breaks in background
        this.preCalculatePageBreaks();
    }

    renderCurrentPage() {
        const verses = this.getFilteredVersesForDisplay();
        const contentArea = this.elements.contentArea;

        if (verses.length === 0) {
            contentArea.innerHTML = '<div class="loading">No verses to display</div>';
            this.updatePageIndicator();
            return;
        }

        // Get the verse range for this page
        const startIdx = this.getPageStartIndex(this.currentPage);
        const endIdx = this.getPageStartIndex(this.currentPage + 1);
        const pageVerses = verses.slice(startIdx, endIdx);

        if (pageVerses.length === 0) {
            contentArea.innerHTML = '<div class="loading">No verses to display</div>';
            this.updatePageIndicator();
            return;
        }

        // Build HTML for just this page's verses
        let html = '';
        let currentBook = '';
        let currentChapter = '';

        // Check if we need book/chapter headings from previous context
        if (startIdx > 0) {
            const prevVerse = verses[startIdx - 1];
            currentBook = prevVerse.book;
            currentChapter = prevVerse.chapter;
        }

        pageVerses.forEach(verse => {
            // Add headings when book or chapter changes
            if (verse.book !== currentBook) {
                html += `<div class="chapter-heading book-heading">${this.escapeHtml(verse.book)}</div>`;
                currentBook = verse.book;
                currentChapter = ''; // Reset chapter to force chapter heading
            }
            if (String(verse.chapter) !== String(currentChapter)) {
                html += `<div class="chapter-heading">Chapter ${verse.chapter}</div>`;
                currentChapter = verse.chapter;
            }

            const highlightClass = this.getHighlightClass(verse.reference);
            const highlightStyle = this.getHighlightStyle(verse.reference);
            const styleAttr = highlightStyle ? ` style="${highlightStyle}"` : '';
            const escapedRef = verse.reference.replace(/"/g, '&quot;');
            let verseContent = this.renderVerseWithPhraseHighlights(verse);
            if (this.searchTerm) {
                verseContent = this.applySearchHighlight(verseContent, verse.text);
            }
            html += `<span class="verse ${highlightClass}"${styleAttr} data-ref="${escapedRef}">`;
            html += `<sup class="verse-ref">${verse.verse}</sup>`;
            html += verseContent;
            html += '</span>';
        });

        // Create the container
        const container = document.createElement('div');
        container.className = `scripture-columns cols-${this.settings.columnCount}`;
        container.innerHTML = html;

        contentArea.innerHTML = '';
        contentArea.appendChild(container);

        this.updatePageIndicator();
    }

    renderVerseWithPhraseHighlights(verse) {
        const phrases = this.phraseHighlights[verse.reference];
        if (!phrases || phrases.length === 0) {
            return this.escapeHtml(verse.text);
        }
        // Sort by start position, then by length (longer phrases first for same start)
        const sortedPhrases = [...phrases].sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            return (b.end - b.start) - (a.end - a.start); // longer first
        });

        let result = '';
        let lastIndex = 0;

        // Helper to generate style based on phrase type
        const getPhraseStyle = (phrase, safeColor) => {
            if (phrase.type === 'box') {
                // Box mode: border only, no fill
                return `border: 0.12em solid ${safeColor}; box-shadow: 0 0 0 0.05em var(--highlight-outline-inner), 0 0 0 0.1em var(--highlight-outline-outer); background: none; color: inherit; padding: 0.05em 0.1em; border-radius: 0.1em;`;
            } else {
                // Highlight mode (default): filled background + border for visibility
                return `background-color: ${safeColor}; border: 0.12em solid ${safeColor}; box-shadow: 0 0 0 0.05em var(--highlight-outline-inner), 0 0 0 0.1em var(--highlight-outline-outer); padding: 0.05em 0.1em; border-radius: 0.1em;`;
            }
        };

        sortedPhrases.forEach(phrase => {
            // Skip phrases that overlap with already-rendered content
            if (phrase.start < lastIndex) {
                // If this phrase extends beyond current lastIndex, we could handle partial overlap
                // For now, skip entirely if it starts within already-rendered text
                if (phrase.end <= lastIndex) {
                    return; // completely contained, skip
                }
                // Partial overlap: adjust start to lastIndex
                const adjustedStart = lastIndex;
                const colorIndex = this.settings.highlightColors.indexOf(phrase.color);
                let highlightClass = colorIndex >= 0 ? `highlight-${colorIndex}` : '';
                const safeColor = this.isValidHexColor(phrase.color) ? phrase.color : '#888888';
                const style = getPhraseStyle(phrase, safeColor);
                if (phrase.color === '#ff00ff') {
                    highlightClass += ' placeholder-highlight';
                }
                if (phrase.type !== 'box' && phrase.color) {
                    highlightClass += this.isDarkColor(phrase.color) ? ' dark-highlight' : ' light-highlight';
                }
                result += `<mark class="phrase-highlight ${highlightClass}" data-phrase-id="${phrase.id}" style="${style}">${this.escapeHtml(verse.text.substring(adjustedStart, phrase.end))}</mark>`;
                lastIndex = phrase.end;
                return;
            }

            // Add text before this phrase (escaped)
            result += this.escapeHtml(verse.text.substring(lastIndex, phrase.start));

            const colorIndex = this.settings.highlightColors.indexOf(phrase.color);
            let highlightClass = colorIndex >= 0 ? `highlight-${colorIndex}` : '';
            const safeColor = this.isValidHexColor(phrase.color) ? phrase.color : '#888888';
            const style = getPhraseStyle(phrase, safeColor);
            if (phrase.color === '#ff00ff') {
                highlightClass += ' placeholder-highlight';
            }
            if (phrase.type !== 'box' && phrase.color) {
                highlightClass += this.isDarkColor(phrase.color) ? ' dark-highlight' : ' light-highlight';
            }
            result += `<mark class="phrase-highlight ${highlightClass}" data-phrase-id="${phrase.id}" style="${style}">${this.escapeHtml(verse.text.substring(phrase.start, phrase.end))}</mark>`;
            lastIndex = phrase.end;
        });

        result += this.escapeHtml(verse.text.substring(lastIndex));
        return result;
    }

    groupByChapter(verses) {
        const groups = [];
        let currentGroup = null;
        verses.forEach(verse => {
            const key = `${verse.book}-${verse.chapter}`;
            if (!currentGroup || currentGroup.key !== key) {
                currentGroup = {
                    key: key,
                    book: verse.book,
                    chapter: verse.chapter,
                    verses: []
                };
                groups.push(currentGroup);
            }
            currentGroup.verses.push(verse);
        });
        return groups;
    }

    getHighlightClass(reference) {
        const highlight = this.highlights[reference];
        if (!highlight) return 'highlight-none';
        const colorIndex = this.settings.highlightColors.indexOf(highlight.color);
        let cls = '';
        if (colorIndex >= 0) {
            cls = `highlight-${colorIndex}`;
        } else if (highlight.color === '#ff00ff') {
            cls = 'placeholder-highlight';
        } else if (this.isValidHexColor(highlight.color)) {
            cls = 'orphan-highlight';
        } else {
            return 'highlight-none';
        }
        if (highlight.color) {
            cls += this.isDarkColor(highlight.color) ? ' dark-highlight' : ' light-highlight';
        }
        return cls;
    }

    getHighlightStyle(reference) {
        const highlight = this.highlights[reference];
        if (!highlight) return '';
        const colorIndex = this.settings.highlightColors.indexOf(highlight.color);
        if (colorIndex >= 0) return ''; // Palette color, CSS handles it
        if (this.isValidHexColor(highlight.color)) {
            return `background-color: ${highlight.color};`;
        }
        return '';
    }

    // Palette management
    renderPalette() {
        this.elements.paletteColors.innerHTML = '';

        // Add cycle mode button - clearer text label
        const cycleBtn = document.createElement('button');
        cycleBtn.className = 'cycle-mode-btn';
        if (this.highlightApplyMode === 'cycle') {
            cycleBtn.classList.add('active');
        }
        cycleBtn.textContent = 'Cycle';
        cycleBtn.title = 'Cycle Mode: Each click advances to the next color (press M to toggle)';
        cycleBtn.addEventListener('click', () => {
            this.highlightApplyMode = 'cycle';
            this.renderPalette();
        });
        this.elements.paletteColors.appendChild(cycleBtn);
        
        // Trigger cycling animation if needed
        if (this.shouldTriggerCycleAnimation) {
            setTimeout(() => {
                const swatches = this.elements.paletteColors.querySelectorAll('.color-swatch-inline');
                swatches.forEach((swatch, idx) => {
                    if (idx === this.currentCycleIndex) {
                        swatch.classList.add('cycling');
                        setTimeout(() => {
                            swatch.classList.remove('cycling');
                        }, 800);
                    }
                });
            }, 50); // Small delay to ensure DOM is updated
            this.shouldTriggerCycleAnimation = false;
        }
        
        this.settings.highlightColors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch-inline';
            swatch.style.backgroundColor = color;
            swatch.title = `Color ${index + 1} - Click to select`;
            // Only show active state in direct mode, not cycle mode
            if (this.highlightApplyMode === 'direct' && index === this.activeHighlightColorIndex) {
                swatch.classList.add('active');
            }
            swatch.addEventListener('click', () => {
                this.activeHighlightColorIndex = index;
                this.highlightApplyMode = 'direct';
                this.renderPalette();
                this.updateModeUI();
            });
            swatch.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const input = document.createElement('input');
                input.type = 'color';
                input.value = color;
                input.style.display = 'none';
                document.body.appendChild(input);
                input.click();
                input.addEventListener('change', () => {
                    this.settings.highlightColors[index] = input.value;
                    this.saveSettings();
                    this.updateHighlightStyles();
                    this.renderPalette();
                    this.renderPage();
                    document.body.removeChild(input);
                });
            });
            swatch.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (this.settings.highlightColors.length > 1) {
                    if (confirm('Remove this color?')) {
                        this.settings.highlightColors.splice(index, 1);
                        if (this.activeHighlightColorIndex >= this.settings.highlightColors.length) {
                            this.activeHighlightColorIndex = this.settings.highlightColors.length - 1;
                        }
                        this.saveSettings();
                        this.updateHighlightStyles();
                        this.renderPalette();
                        this.renderPage();
                    }
                }
            });
            this.elements.paletteColors.appendChild(swatch);
        });

        // Add the "Add Color" button after the color swatches
        const addButton = document.createElement('button');
        addButton.className = 'inline-btn add-color-btn';
        addButton.title = 'Add Color';
        addButton.textContent = '+';
        addButton.addEventListener('click', () => {
            this.showColorPicker();
        });
        this.elements.paletteColors.appendChild(addButton);

        // Show orphaned colors (used in highlights but not in palette)
        const orphanedColors = this.getOrphanedColors();
        if (orphanedColors.length > 0) {
            const separator = document.createElement('span');
            separator.style.cssText = 'margin: 0 6px; color: var(--text-secondary); opacity: 0.5;';
            separator.textContent = '|';
            this.elements.paletteColors.appendChild(separator);

            const label = document.createElement('span');
            label.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-right: 4px; cursor: help;';
            label.textContent = 'Orphaned:';
            label.title = 'Colors used in highlights but not in palette. Click to restore.';
            this.elements.paletteColors.appendChild(label);

            orphanedColors.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch-inline orphan-swatch';
                swatch.style.backgroundColor = color;
                swatch.title = `${color} - Click to add to palette`;
                swatch.addEventListener('click', () => {
                    this.settings.highlightColors.push(color);
                    this.saveSettings();
                    this.updateHighlightStyles();
                    this.renderPalette();
                    this.renderPage();
                    this.showToast(`Added ${color} to palette`);
                });
                this.elements.paletteColors.appendChild(swatch);
            });
        }
    }

    updateHighlightStyles() {
        this.settings.highlightColors.forEach((color, index) => {
            let styleEl = document.getElementById(`highlight-style-${index}`);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = `highlight-style-${index}`;
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = `.highlight-${index} { background-color: ${color}; }`;
        });
    }

    // Event handling
    setupEventListeners() {
        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTheme(btn.dataset.theme);
            });
        });

        // Navigation - lazy load volumes
        this.elements.volumeSelect.addEventListener('change', async () => {
            const volume = this.elements.volumeSelect.value;
            this.filters.volume = volume;
            this.filters.book = '';
            this.filters.chapter = '';
            this.filters.verse = '';

            if (volume) {
                // Load single volume
                await this.loadVolume(volume);
            } else {
                // "All Volumes" selected - load all
                await this.loadAllVolumes();
            }

            this.updateBookFilter();
            this.applyFilters();
            this.renderPage();
            this.savePosition();
        });

        this.elements.bookSelect.addEventListener('change', () => {
            this.filters.book = this.elements.bookSelect.value;
            this.filters.chapter = '';
            this.filters.verse = '';
            this.updateChapterFilter();
            this.applyFilters();
            this.renderPage();
            this.savePosition();
        });

        this.elements.chapterSelect.addEventListener('change', () => {
            this.filters.chapter = this.elements.chapterSelect.value;
            this.filters.verse = '';
            this.updateVerseFilter();
            this.applyFilters();
            this.renderPage();
            this.savePosition();
        });

        this.elements.verseSelect.addEventListener('change', () => {
            this.filters.verse = this.elements.verseSelect.value;
            this.applyFilters();
            this.renderPage();
            this.savePosition();
        });

        // Pagination
        this.elements.prevPageBtn.addEventListener('click', () => {
            this.goToPage(this.currentPage - 1);
        });

        this.elements.nextPageBtn.addEventListener('click', () => {
            this.goToPage(this.currentPage + 1);
        });

        // Resize handler - clear cache and re-render when window resizes
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.clearPageBreakCache();
                this.renderPage();
            }, 150);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z for undo (works even in inputs)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                this.undo();
                return;
            }
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                this.goToPage(this.currentPage - 1);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                this.goToPage(this.currentPage + 1);
            } else if (e.key === 'm' || e.key === 'M') {
                // Toggle between cycle and direct mode
                e.preventDefault();
                if (this.highlightApplyMode === 'cycle') {
                    this.highlightApplyMode = 'direct';
                } else {
                    this.highlightApplyMode = 'cycle';
                }
                this.renderPalette();
                this.updateModeUI();
                this.showToast(this.highlightApplyMode === 'cycle' ? 'Cycle mode' : 'Direct mode');
            } else if (e.key === 'b' || e.key === 'B') {
                // Toggle drag mode (highlight vs box)
                e.preventDefault();
                this.dragMode = this.dragMode === 'highlight' ? 'box' : 'highlight';
                this.updateModeUI();
                this.showToast(this.dragMode === 'box' ? 'Box mode' : 'Highlight mode');
            } else if (e.key >= '1' && e.key <= '9') {
                // Number keys select colors directly
                const colorIndex = parseInt(e.key, 10) - 1;
                if (colorIndex < this.settings.highlightColors.length) {
                    e.preventDefault();
                    this.activeHighlightColorIndex = colorIndex;
                    this.highlightApplyMode = 'direct';
                    this.renderPalette();
                    this.updateModeUI();
                }
            }
        });

        // Mouse interaction for highlighting
        this.elements.contentArea.addEventListener('mousedown', (e) => {
            this.isDragging = false;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        });

        this.elements.contentArea.addEventListener('mousemove', (e) => {
            if (!this.isDragging) {
                const deltaX = Math.abs(e.clientX - this.dragStartX);
                const deltaY = Math.abs(e.clientY - this.dragStartY);
                if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                    this.isDragging = true;
                }
            }
        });

        this.elements.contentArea.addEventListener('mouseup', (e) => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (this.isDragging && selectedText) {
                // Handle drag selection based on drag mode
                if (this.dragMode === 'box') {
                    // Box mode: outline selected text with border only
                    this.handleBoxSelect();
                } else {
                    // Highlight mode: fill selected text with color
                    const verse = e.target.closest('.verse');
                    if (verse) {
                        this.expandSelectionToWordBoundaries();
                        this.handlePhraseHighlight(verse);
                    }
                }
            } else if (!this.isDragging) {
                // Handle click
                const verse = e.target.closest('.verse');
                if (verse && !e.target.classList.contains('phrase-highlight')) {
                    this.handleVerseClick(verse.dataset.ref);
                }
            }
        });

        // Phrase highlight clicking
        this.elements.contentArea.addEventListener('click', (e) => {
            if (e.target.classList.contains('phrase-highlight')) {
                e.stopPropagation();
                this.cyclePhraseHighlight(e.target);
            }
        });

        // Inline Controls
        this.elements.decreaseFontBtn.addEventListener('click', () => {
            if (this.settings.fontSize > 10) {
                this.settings.fontSize -= 2;
                this.saveSettings();
                this.applySettings();
                this.clearPageBreakCache();
                this.renderPage();
            }
        });

        this.elements.increaseFontBtn.addEventListener('click', () => {
            if (this.settings.fontSize < 48) {
                this.settings.fontSize += 2;
                this.saveSettings();
                this.applySettings();
                this.clearPageBreakCache();
                this.renderPage();
            }
        });

        this.elements.decreaseColumnsBtn.addEventListener('click', () => {
            if (this.settings.columnCount > 1) {
                this.settings.columnCount--;
                this.saveSettings();
                this.applySettings();
                this.clearPageBreakCache();
                this.renderPage();
            }
        });

        this.elements.increaseColumnsBtn.addEventListener('click', () => {
            if (this.settings.columnCount < 6) {
                this.settings.columnCount++;
                this.saveSettings();
                this.applySettings();
                this.clearPageBreakCache();
                this.renderPage();
            }
        });

        this.elements.undoBtn.addEventListener('click', () => {
            this.undo();
        });

        this.elements.resetColorsBtn.addEventListener('click', () => {
            this.resetColors();
        });

        this.elements.exportBtn.addEventListener('click', () => {
            this.exportHighlights();
        });

        this.elements.importBtn.addEventListener('click', () => {
            this.elements.importTextarea.value = '';
            document.getElementById('importPreview').classList.add('hidden');
            document.getElementById('importOptions').classList.add('hidden');
            // Reset to default strategy
            const replaceRadio = document.querySelector('input[name="importStrategy"][value="replace"]');
            if (replaceRadio) replaceRadio.checked = true;
            this.elements.importModal.classList.remove('hidden');
        });

        this.elements.clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all highlights?')) {
                if (confirm('Export first?')) {
                    this.exportHighlights();
                }
                this.saveUndoState();
                this.highlights = {};
                this.phraseHighlights = {};
                this.saveHighlights();
                this.renderPage();
            }
        });

        // Import modal
        this.elements.closeImportBtn.addEventListener('click', () => {
            this.closeImportModal();
        });

        this.elements.cancelImportBtn.addEventListener('click', () => {
            this.closeImportModal();
        });

        this.elements.confirmImportBtn.addEventListener('click', () => {
            this.importHighlights();
        });

        // Import preview on paste/input
        this.elements.importTextarea.addEventListener('input', () => {
            this.updateImportPreview();
        });

        this.elements.importTextarea.addEventListener('paste', () => {
            // Delay to let paste complete
            setTimeout(() => this.updateImportPreview(), 50);
        });

        // File upload for import
        this.elements.importFileBtn.addEventListener('click', () => {
            this.elements.importFileInput.click();
        });

        this.elements.importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File too large. Maximum size is 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                this.elements.importTextarea.value = event.target.result;
                this.updateImportPreview();
            };
            reader.onerror = () => {
                alert('Error reading file.');
            };
            reader.readAsText(file);

            // Reset input so same file can be selected again
            e.target.value = '';
        });

        // Search functionality
        this.elements.searchInput.addEventListener('input', () => {
            this.performSearch();
        });

        this.elements.clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        this.elements.highlightPhrasesBtn.addEventListener('click', () => {
            this.highlightAllPhrases();
        });

        this.elements.highlightVersesBtn.addEventListener('click', () => {
            this.highlightAllVerses();
        });

        // Drag mode toggle
        if (this.elements.dragHighlightBtn) {
            this.elements.dragHighlightBtn.addEventListener('click', () => {
                this.dragMode = 'highlight';
                this.updateModeUI();
            });
        }

        if (this.elements.dragBoxBtn) {
            this.elements.dragBoxBtn.addEventListener('click', () => {
                this.dragMode = 'box';
                this.updateModeUI();
            });
        }
    }

    closeImportModal() {
        this.elements.importModal.classList.add('hidden');
        this.elements.importTextarea.value = '';
        document.getElementById('importPreview').classList.add('hidden');
        document.getElementById('importOptions').classList.add('hidden');
    }

    // Highlighting logic
    handleVerseClick(reference) {
        this.saveUndoState();
        const currentHighlight = this.highlights[reference];
        const selectedColor = this.settings.highlightColors[this.activeHighlightColorIndex];

        if (this.highlightApplyMode === 'direct') {
            // Toggle mode: if already this color, remove; otherwise apply
            if (currentHighlight && currentHighlight.color === selectedColor) {
                delete this.highlights[reference];
                this.showToast('Highlight removed!');
            } else {
                this.highlights[reference] = {
                    color: selectedColor,
                    timestamp: Date.now()
                };
            }
            this.currentCycleIndex = this.activeHighlightColorIndex;
        } else {
            if (!currentHighlight) {
                this.highlights[reference] = {
                    color: this.settings.highlightColors[0],
                    timestamp: Date.now()
                };
                this.currentCycleIndex = 0;
                this.shouldTriggerCycleAnimation = true;
            } else {
                const currentIndex = this.settings.highlightColors.indexOf(currentHighlight.color);
                const nextIndex = (currentIndex + 1) % (this.settings.highlightColors.length + 1);
                if (nextIndex === this.settings.highlightColors.length) {
                    delete this.highlights[reference];
                    this.showToast('Highlight removed!');
                    this.currentCycleIndex = 0; // reset to first color
                    this.shouldTriggerCycleAnimation = true;
                } else {
                    this.highlights[reference] = {
                        color: this.settings.highlightColors[nextIndex],
                        timestamp: Date.now()
                    };
                    this.currentCycleIndex = nextIndex;
                    this.shouldTriggerCycleAnimation = true;
                }
            }
        }
        this.saveHighlights();
        this.renderPage();
    }

    handlePhraseHighlight(verseElement) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        if (!selectedText) return;
        this.saveUndoState();
        const ref = verseElement.dataset.ref;
        const verseData = this.filteredScriptures.find(v => v.reference === ref);
        if (!verseData) return;

        // Get the exact position in the verse text by accounting for HTML structure
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(verseElement);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const textBeforeSelection = preSelectionRange.toString();
        const supLength = verseElement.childNodes[0].textContent.length;
        const startPosInElement = textBeforeSelection.length - supLength;

        // Find the selected text in verseData.text, starting near the calculated position
        let actualStart = -1;
        const searchStart = Math.max(0, startPosInElement - selectedText.length);
        const searchEnd = Math.min(verseData.text.length, startPosInElement + selectedText.length);
        for (let i = searchStart; i <= searchEnd - selectedText.length; i++) {
            if (verseData.text.substring(i, i + selectedText.length) === selectedText) {
                actualStart = i;
                break;
            }
        }
        if (actualStart === -1) {
            // Fallback to first occurrence if not found near expected position
            actualStart = verseData.text.indexOf(selectedText);
        }
        if (actualStart === -1) return;
        const actualEnd = actualStart + selectedText.length;

        if (!this.phraseHighlights[ref]) {
            this.phraseHighlights[ref] = [];
        }
        const existingIndex = this.phraseHighlights[ref].findIndex(
            p => p.start === actualStart && p.end === actualEnd
        );
        if (this.highlightApplyMode === 'direct') {
            if (existingIndex >= 0) {
                this.phraseHighlights[ref][existingIndex].color = this.settings.highlightColors[this.activeHighlightColorIndex];
                this.phraseHighlights[ref][existingIndex].type = 'highlight';
            } else {
                this.phraseHighlights[ref].push({
                    id: Date.now(),
                    start: actualStart,
                    end: actualEnd,
                    text: selectedText,
                    color: this.settings.highlightColors[this.activeHighlightColorIndex],
                    type: 'highlight',
                    timestamp: Date.now()
                });
            }
        } else {
            if (existingIndex >= 0) {
                const current = this.phraseHighlights[ref][existingIndex];
                const currentIndex = this.settings.highlightColors.indexOf(current.color);
                const nextIndex = (currentIndex + 1) % (this.settings.highlightColors.length + 1);
                if (nextIndex === this.settings.highlightColors.length) {
                    this.phraseHighlights[ref].splice(existingIndex, 1);
                    if (this.phraseHighlights[ref].length === 0) {
                        delete this.phraseHighlights[ref];
                    }
                    this.showToast('Highlight removed!');
                } else {
                    this.phraseHighlights[ref][existingIndex].color = this.settings.highlightColors[nextIndex];
                    this.phraseHighlights[ref][existingIndex].type = 'highlight';
                }
            } else {
                this.phraseHighlights[ref].push({
                    id: Date.now(),
                    start: actualStart,
                    end: actualEnd,
                    text: selectedText,
                    color: this.settings.highlightColors[this.activeHighlightColorIndex],
                    type: 'highlight',
                    timestamp: Date.now()
                });
            }
        }
        selection.removeAllRanges();
        this.saveHighlights();
        this.renderPage();
    }

    handleBoxSelect() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        this.saveUndoState();

        // Expand selection to word boundaries first
        this.expandSelectionToWordBoundaries();

        const range = selection.getRangeAt(0);
        const verses = this.elements.contentArea.querySelectorAll('.verse');
        const color = this.settings.highlightColors[
            this.highlightApplyMode === 'direct' ? this.activeHighlightColorIndex : this.currentCycleIndex
        ];

        let highlightCount = 0;

        // For each verse that intersects with the selection, create a phrase highlight
        verses.forEach(verse => {
            if (!range.intersectsNode(verse)) return;

            const ref = verse.dataset.ref;
            const verseData = this.filteredScriptures.find(v => v.reference === ref);
            if (!verseData) return;

            // Get the intersection of the selection with this verse
            const verseRange = document.createRange();
            verseRange.selectNodeContents(verse);

            // Calculate the start and end within this verse
            const startInVerse = range.compareBoundaryPoints(Range.START_TO_START, verseRange) <= 0
                ? 0
                : this.getTextOffsetInVerse(verse, range.startContainer, range.startOffset);

            const endInVerse = range.compareBoundaryPoints(Range.END_TO_END, verseRange) >= 0
                ? verseData.text.length
                : this.getTextOffsetInVerse(verse, range.endContainer, range.endOffset);

            if (startInVerse >= endInVerse) return;

            // Expand to word boundaries within the verse text
            const expanded = this.expandToWordBoundaries(verseData.text, startInVerse, endInVerse);

            if (!this.phraseHighlights[ref]) {
                this.phraseHighlights[ref] = [];
            }

            // Check if this phrase highlight already exists
            const exists = this.phraseHighlights[ref].some(
                p => p.start === expanded.start && p.end === expanded.end
            );

            if (!exists) {
                this.phraseHighlights[ref].push({
                    id: Date.now() + Math.random(),
                    start: expanded.start,
                    end: expanded.end,
                    text: expanded.text,
                    color: color,
                    type: 'box',
                    timestamp: Date.now()
                });
                highlightCount++;
            }
        });

        // Advance cycle if in cycle mode
        if (this.highlightApplyMode === 'cycle' && highlightCount > 0) {
            this.currentCycleIndex = (this.currentCycleIndex + 1) % this.settings.highlightColors.length;
            this.shouldTriggerCycleAnimation = true;
        }

        selection.removeAllRanges();
        this.saveHighlights();
        if (highlightCount > 0) {
            this.showToast(`Highlighted ${highlightCount} phrase${highlightCount > 1 ? 's' : ''}!`);
        }
        this.renderPalette();
        this.renderPage();
    }

    getTextOffsetInVerse(verseElement, node, offset) {
        // Calculate the text offset within the verse, accounting for the verse number <sup>
        const range = document.createRange();
        range.selectNodeContents(verseElement);
        range.setEnd(node, offset);

        const text = range.toString();
        // Subtract the verse number length (the <sup> content)
        const supElement = verseElement.querySelector('.verse-ref');
        const supLength = supElement ? supElement.textContent.length : 0;

        return Math.max(0, text.length - supLength);
    }

    cyclePhraseHighlight(phraseElement) {
        const verseElement = phraseElement.closest('.verse');
        if (!verseElement) return;
        const ref = verseElement.dataset.ref;
        const phraseId = parseInt(phraseElement.dataset.phraseId, 10);
        if (!this.phraseHighlights[ref]) return;
        const phraseIndex = this.phraseHighlights[ref].findIndex(p => p.id === phraseId);
        if (phraseIndex === -1) return;
        this.saveUndoState();
        const phrase = this.phraseHighlights[ref][phraseIndex];
        const currentIndex = this.settings.highlightColors.indexOf(phrase.color);
        const nextIndex = (currentIndex + 1) % (this.settings.highlightColors.length + 1);
        if (nextIndex === this.settings.highlightColors.length) {
            // Remove the phrase highlight
            this.phraseHighlights[ref].splice(phraseIndex, 1);
            if (this.phraseHighlights[ref].length === 0) {
                delete this.phraseHighlights[ref];
            }
            this.showToast('Highlight removed!');
        } else {
            this.phraseHighlights[ref][phraseIndex].color = this.settings.highlightColors[nextIndex];
        }
        this.saveHighlights();
        this.renderPage();
    }

    expandSelectionToWordBoundaries() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        if (startContainer.nodeType === Node.TEXT_NODE) {
            const text = startContainer.textContent;
            let startOffset = range.startOffset;
            while (startOffset > 0 && /\w/.test(text[startOffset - 1])) {
                startOffset--;
            }
            range.setStart(startContainer, startOffset);
        }
        if (endContainer.nodeType === Node.TEXT_NODE) {
            const text = endContainer.textContent;
            let endOffset = range.endOffset;
            while (endOffset < text.length && /\w/.test(text[endOffset])) {
                endOffset++;
            }
            range.setEnd(endContainer, endOffset);
        }
        selection.removeAllRanges();
        selection.addRange(range);
    }

    // Palette actions
    showColorPicker() {
        const webSafeColors = [
            '#ff4d4d', '#ff9900', '#ffe066', '#66ff66', '#66b3ff', '#8c66ff', '#d966ff',
            '#ff9999', '#ffb84d', '#fff599', '#b3ffb3', '#b3d1ff', '#b399ff', '#e0b3ff',
            '#ffcccc', '#ffd699', '#fffccc', '#d9ffd9', '#d9e6ff', '#d9ccff', '#f0d9ff',
            '#b32400', '#b36b00', '#b3b300', '#009933', '#0059b3', '#4b0082', '#800080',
            '#ffb3b3', '#ffe4b3', '#fff3cd', '#c3e6cb', '#b8daff', '#e2d9f3', '#f8bbd0',
            '#e0e0e0', '#cccccc', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242'
        ];
        const addBtn = this.elements.paletteColors.querySelector('.add-color-btn');
        const parent = addBtn.parentElement;
        let palette = document.createElement('div');
        palette.className = 'custom-color-palette';
        palette.style.position = 'absolute';
        palette.style.left = (addBtn.offsetLeft - 220) + 'px';
        palette.style.top = (addBtn.offsetTop - 8) + 'px';
        palette.style.zIndex = 1000;
        webSafeColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'custom-color-swatch';
            swatch.style.backgroundColor = color;
            swatch.title = color;
            swatch.addEventListener('click', () => {
                this.settings.highlightColors.push(color);
                this.activeHighlightColorIndex = this.settings.highlightColors.length - 1;
                this.saveSettings();
                this.updateHighlightStyles();
                this.renderPalette();
                if (palette.parentElement) palette.parentElement.removeChild(palette);
            });
            palette.appendChild(swatch);
        });
        const moreBtn = document.createElement('button');
        moreBtn.textContent = 'More...';
        moreBtn.className = 'custom-color-more-btn';
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (palette.parentElement) palette.parentElement.removeChild(palette);
            const input = document.createElement('input');
            input.type = 'color';
            input.value = '#e0e0e0';
            input.style.position = 'absolute';
            input.style.left = (addBtn.offsetLeft - 40) + 'px';
            input.style.top = (addBtn.offsetTop) + 'px';
            input.style.zIndex = 1000;
            parent.insertBefore(input, addBtn);
            input.focus();
            input.click();
            input.addEventListener('input', () => {
                this.settings.highlightColors.push(input.value);
                this.activeHighlightColorIndex = this.settings.highlightColors.length - 1;
                this.saveSettings();
                this.updateHighlightStyles();
                this.renderPalette();
                if (input.parentElement) input.parentElement.removeChild(input);
            }, { once: true });
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    if (input.parentElement) input.parentElement.removeChild(input);
                }, 200);
            }, { once: true });
        });
        palette.appendChild(moreBtn);
        const removePalette = (e) => {
            if (!palette.contains(e.target) && e.target !== addBtn) {
                if (palette.parentElement) palette.parentElement.removeChild(palette);
                document.removeEventListener('mousedown', removePalette);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', removePalette), 10);
        parent.insertBefore(palette, addBtn);
    }

    resetColors() {
        if (!confirm('Reset color palette to defaults?\n\nYour highlights will keep their original colors.')) {
            return;
        }
        const defaultColors = ['#c3e6cb', '#fff3cd', '#f8d7da', '#e2d9f3'];
        this.settings.highlightColors = defaultColors;
        this.activeHighlightColorIndex = 0;
        this.saveSettings();
        this.updateHighlightStyles();
        this.renderPalette();
        this.renderPage();

        const orphaned = this.getOrphanedColors();
        if (orphaned.length > 0) {
            this.showToast(`${orphaned.length} orphaned color(s) preserved`);
        }
    }

    // Import/Export
    exportHighlights() {
        const format = prompt('Export format:\n\n1 = JSON (for backup/import)\n2 = HTML (for reading/printing)\n\nEnter 1 or 2:', '1');
        if (format === '2') {
            this.exportHighlightsHTML();
        } else if (format === '1') {
            this.exportHighlightsJSON();
        }
    }

    exportHighlightsJSON() {
        const data = {
            highlights: this.highlights,
            phraseHighlights: this.phraseHighlights,
            colors: this.settings.highlightColors,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scripture-highlights-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportHighlightsHTML() {
        // Collect all highlighted verses and phrases
        const highlightedRefs = new Set([
            ...Object.keys(this.highlights),
            ...Object.keys(this.phraseHighlights)
        ]);

        if (highlightedRefs.size === 0) {
            alert('No highlights to export.');
            return;
        }

        // Get verse data for all highlighted references
        const highlightedVerses = this.scriptures
            .filter(v => highlightedRefs.has(v.reference))
            .sort((a, b) => {
                // Sort by book order, then chapter, then verse
                if (a.book !== b.book) {
                    return this.scriptures.findIndex(v => v.book === a.book) -
                           this.scriptures.findIndex(v => v.book === b.book);
                }
                if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                return a.verse - b.verse;
            });

        // Build HTML document
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scripture Highlights - Exported ${new Date().toLocaleDateString()}</title>
    <style>
        body {
            font-family: Georgia, 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 0.5rem;
        }
        h2 {
            margin-top: 2rem;
            color: #555;
        }
        h3 {
            margin-top: 1.5rem;
            font-size: 1.1rem;
        }
        .verse {
            margin: 0.5rem 0;
            padding: 0.5rem;
            border-radius: 4px;
        }
        .verse-ref {
            font-weight: bold;
            margin-right: 0.5rem;
        }
        .phrase-highlight {
            padding: 0.1em 0.2em;
            border-radius: 3px;
        }
        .box-highlight {
            border: 2px solid;
            padding: 0.1em 0.2em;
            border-radius: 3px;
            background: transparent !important;
        }
        .export-info {
            text-align: center;
            font-size: 0.9rem;
            color: #666;
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid #ccc;
        }
        @media print {
            body { padding: 0; }
            h1 { page-break-after: avoid; }
            h2, h3 { page-break-after: avoid; }
            .verse { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>Scripture Highlights</h1>
`;

        let currentBook = '';
        let currentChapter = '';

        highlightedVerses.forEach(verse => {
            // Add book heading
            if (verse.book !== currentBook) {
                html += `    <h2>${this.escapeHtml(verse.book)}</h2>\n`;
                currentBook = verse.book;
                currentChapter = '';
            }

            // Add chapter heading
            if (String(verse.chapter) !== currentChapter) {
                html += `    <h3>Chapter ${verse.chapter}</h3>\n`;
                currentChapter = String(verse.chapter);
            }

            // Determine verse background color
            const verseHighlight = this.highlights[verse.reference];
            const verseStyle = verseHighlight ?
                `background-color: ${verseHighlight.color}20; border-left: 4px solid ${verseHighlight.color};` :
                '';

            // Render verse text with phrase highlights
            let verseText = this.escapeHtml(verse.text);
            const phrases = this.phraseHighlights[verse.reference];
            if (phrases && phrases.length > 0) {
                // Sort phrases by start position (descending) to replace from end
                const sortedPhrases = [...phrases].sort((a, b) => b.start - a.start);
                sortedPhrases.forEach(phrase => {
                    const before = verseText.substring(0, phrase.start);
                    const highlighted = verseText.substring(phrase.start, phrase.end);
                    const after = verseText.substring(phrase.end);

                    if (phrase.type === 'box') {
                        verseText = `${before}<span class="phrase-highlight box-highlight" style="border-color: ${phrase.color};">${highlighted}</span>${after}`;
                    } else {
                        verseText = `${before}<span class="phrase-highlight" style="background-color: ${phrase.color};">${highlighted}</span>${after}`;
                    }
                });
            }

            html += `    <div class="verse" style="${verseStyle}">
        <span class="verse-ref">${verse.verse}</span>${verseText}
    </div>\n`;
        });

        html += `
    <div class="export-info">
        <p>Exported from Scripture Highlighter on ${new Date().toLocaleString()}</p>
        <p>${highlightedVerses.length} highlighted verses</p>
    </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scripture-highlights-${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast(`Exported ${highlightedVerses.length} verses!`);
    }

    previewImport(jsonText) {
        try {
            const data = JSON.parse(jsonText);
            if (!data.highlights || typeof data.highlights !== 'object') {
                return { valid: false, error: 'Invalid format: no highlights found' };
            }

            // Validate highlight data structure
            for (const [ref, highlight] of Object.entries(data.highlights)) {
                if (typeof ref !== 'string' || ref.length > 100) {
                    return { valid: false, error: 'Invalid reference in highlights' };
                }
                if (!highlight || typeof highlight !== 'object') {
                    return { valid: false, error: 'Invalid highlight data' };
                }
                if (highlight.color && !this.isValidHexColor(highlight.color)) {
                    // Sanitize invalid colors
                    data.highlights[ref].color = '#888888';
                }
            }

            // Validate phrase highlights
            if (data.phraseHighlights && typeof data.phraseHighlights === 'object') {
                for (const [ref, phrases] of Object.entries(data.phraseHighlights)) {
                    if (typeof ref !== 'string' || ref.length > 100) {
                        return { valid: false, error: 'Invalid reference in phrase highlights' };
                    }
                    if (!Array.isArray(phrases)) {
                        return { valid: false, error: 'Invalid phrase highlight data' };
                    }
                    for (const phrase of phrases) {
                        if (typeof phrase.start !== 'number' || typeof phrase.end !== 'number') {
                            return { valid: false, error: 'Invalid phrase position data' };
                        }
                        if (phrase.color && !this.isValidHexColor(phrase.color)) {
                            phrase.color = '#888888';
                        }
                    }
                }
            }

            const importRefs = Object.keys(data.highlights || {});
            const importPhraseRefs = Object.keys(data.phraseHighlights || {});
            const existingRefs = Object.keys(this.highlights);
            const existingPhraseRefs = Object.keys(this.phraseHighlights);

            // Calculate conflicts for verse highlights
            const verseConflicts = importRefs.filter(ref => existingRefs.includes(ref));
            const newVerses = importRefs.filter(ref => !existingRefs.includes(ref));

            // Calculate phrase conflicts (same ref might have overlapping phrases)
            let phraseConflicts = 0;
            let newPhrases = 0;
            importPhraseRefs.forEach(ref => {
                const importPhrases = data.phraseHighlights[ref] || [];
                const existingPhrases = this.phraseHighlights[ref] || [];
                importPhrases.forEach(ip => {
                    const hasConflict = existingPhrases.some(ep =>
                        (ip.start < ep.end && ip.end > ep.start) // overlapping ranges
                    );
                    if (hasConflict) phraseConflicts++;
                    else newPhrases++;
                });
            });

            return {
                valid: true,
                data: data,
                stats: {
                    newVerses: newVerses.length,
                    verseConflicts: verseConflicts.length,
                    newPhrases: newPhrases,
                    phraseConflicts: phraseConflicts,
                    totalImport: importRefs.length + importPhraseRefs.reduce((sum, ref) =>
                        sum + (data.phraseHighlights[ref]?.length || 0), 0),
                    hasConflicts: verseConflicts.length > 0 || phraseConflicts > 0
                }
            };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    updateImportPreview() {
        const preview = this.previewImport(this.elements.importTextarea.value);
        const previewEl = document.getElementById('importPreview');
        const optionsEl = document.getElementById('importOptions');

        if (!preview.valid) {
            previewEl.classList.add('hidden');
            optionsEl.classList.add('hidden');
            return;
        }

        // Update stats display
        document.getElementById('importStatsNew').textContent =
            `${preview.stats.newVerses + preview.stats.newPhrases} new`;
        document.getElementById('importStatsConflict').textContent =
            `${preview.stats.verseConflicts + preview.stats.phraseConflicts} conflicts`;
        document.getElementById('importStatsTotal').textContent =
            `${preview.stats.totalImport} total`;

        previewEl.classList.remove('hidden');

        // Show options if there are existing highlights
        const hasExisting = Object.keys(this.highlights).length > 0 ||
                           Object.keys(this.phraseHighlights).length > 0;
        if (hasExisting) {
            optionsEl.classList.remove('hidden');
        } else {
            optionsEl.classList.add('hidden');
        }
    }

    importHighlights() {
        const preview = this.previewImport(this.elements.importTextarea.value);

        if (!preview.valid) {
            alert('Error parsing JSON: ' + preview.error);
            return;
        }

        this.saveUndoState();
        const data = preview.data;
        const strategy = document.querySelector('input[name="importStrategy"]:checked')?.value || 'replace';

        switch (strategy) {
            case 'replace':
                this.importReplace(data);
                break;
            case 'addNew':
                this.importAddNew(data);
                break;
            case 'preferImport':
                this.importPreferImport(data);
                break;
            case 'layer':
                this.importLayer(data);
                break;
        }

        // Merge colors from import if they're new and valid
        if (data.colors && Array.isArray(data.colors)) {
            data.colors.forEach(color => {
                if (this.isValidHexColor(color) && !this.settings.highlightColors.includes(color)) {
                    this.settings.highlightColors.push(color);
                }
            });
        }

        this.saveHighlights();
        this.saveSettings();
        this.updateHighlightStyles();
        this.renderPalette();
        this.renderPage();
        this.elements.importModal.classList.add('hidden');
        this.elements.importTextarea.value = '';
        document.getElementById('importPreview').classList.add('hidden');
        document.getElementById('importOptions').classList.add('hidden');
        this.showToast('Highlights imported!');
    }

    importReplace(data) {
        // Complete replacement
        this.highlights = data.highlights || {};
        this.phraseHighlights = data.phraseHighlights || {};
        if (data.colors && Array.isArray(data.colors)) {
            const validColors = data.colors.filter(c => this.isValidHexColor(c));
            if (validColors.length > 0) {
                this.settings.highlightColors = validColors;
            }
        }
    }

    importAddNew(data) {
        // Only add highlights for verses that don't already have highlights
        Object.entries(data.highlights || {}).forEach(([ref, highlight]) => {
            if (!this.highlights[ref]) {
                this.highlights[ref] = highlight;
            }
        });

        // Add non-overlapping phrase highlights
        Object.entries(data.phraseHighlights || {}).forEach(([ref, phrases]) => {
            if (!this.phraseHighlights[ref]) {
                this.phraseHighlights[ref] = [];
            }
            phrases.forEach(newPhrase => {
                const hasOverlap = this.phraseHighlights[ref].some(existing =>
                    newPhrase.start < existing.end && newPhrase.end > existing.start
                );
                if (!hasOverlap) {
                    this.phraseHighlights[ref].push({
                        ...newPhrase,
                        id: Date.now() + Math.random()
                    });
                }
            });
        });
    }

    importPreferImport(data) {
        // Keep existing, but let import win on conflicts
        Object.entries(data.highlights || {}).forEach(([ref, highlight]) => {
            this.highlights[ref] = highlight;
        });

        // For phrases, replace overlapping ones with import versions
        Object.entries(data.phraseHighlights || {}).forEach(([ref, phrases]) => {
            if (!this.phraseHighlights[ref]) {
                this.phraseHighlights[ref] = [];
            }
            phrases.forEach(newPhrase => {
                // Remove overlapping existing phrases
                this.phraseHighlights[ref] = this.phraseHighlights[ref].filter(existing =>
                    !(newPhrase.start < existing.end && newPhrase.end > existing.start)
                );
                // Add the new phrase
                this.phraseHighlights[ref].push({
                    ...newPhrase,
                    id: Date.now() + Math.random()
                });
            });
        });
    }

    importLayer(data) {
        // Smart layering: for conflicts, convert verse highlight to phrase and keep both
        Object.entries(data.highlights || {}).forEach(([ref, importHighlight]) => {
            if (this.highlights[ref]) {
                // Conflict - convert existing verse highlight to a phrase highlight
                const verseData = this.scriptures.find(v => v.reference === ref);
                if (verseData) {
                    if (!this.phraseHighlights[ref]) {
                        this.phraseHighlights[ref] = [];
                    }
                    // Add existing verse color as an underline/phrase covering whole verse
                    this.phraseHighlights[ref].push({
                        id: Date.now() + Math.random(),
                        start: 0,
                        end: verseData.text.length,
                        text: verseData.text,
                        color: this.highlights[ref].color,
                        timestamp: Date.now(),
                        layered: true
                    });
                }
            }
            // Set the imported highlight as the verse highlight
            this.highlights[ref] = importHighlight;
        });

        // For phrase highlights, add all - they'll stack visually
        Object.entries(data.phraseHighlights || {}).forEach(([ref, phrases]) => {
            if (!this.phraseHighlights[ref]) {
                this.phraseHighlights[ref] = [];
            }
            phrases.forEach(newPhrase => {
                this.phraseHighlights[ref].push({
                    ...newPhrase,
                    id: Date.now() + Math.random()
                });
            });
        });
    }

    // Search functionality
    performSearch() {
        const term = this.elements.searchInput.value.trim().toLowerCase();
        this.searchTerm = term;

        if (!term) {
            this.clearSearch();
            return;
        }

        // Find all matches in filtered scriptures
        this.searchResults = [];
        this.filteredScriptures.forEach(verse => {
            const text = verse.text.toLowerCase();
            let index = 0;
            while ((index = text.indexOf(term, index)) !== -1) {
                this.searchResults.push({
                    reference: verse.reference,
                    start: index,
                    end: index + term.length,
                    text: verse.text.substring(index, index + term.length)
                });
                index += 1;
            }
        });

        // Update UI
        const matchCount = this.searchResults.length;
        const verseCount = new Set(this.searchResults.map(r => r.reference)).size;
        this.elements.searchCount.textContent = matchCount > 0
            ? `${matchCount} in ${verseCount}v`
            : 'No matches';

        // Show/hide action buttons
        const hasResults = matchCount > 0;
        this.elements.highlightPhrasesBtn.classList.toggle('hidden', !hasResults);
        this.elements.highlightVersesBtn.classList.toggle('hidden', !hasResults);
        this.elements.clearSearchBtn.classList.toggle('hidden', !term);

        // Reset to first page when searching
        this.currentPage = 0;

        // Re-render to show filtered results with highlights
        this.renderPage();
    }

    clearSearch() {
        this.searchTerm = '';
        this.searchResults = [];
        this.elements.searchInput.value = '';
        this.elements.searchCount.textContent = '';
        this.elements.highlightPhrasesBtn.classList.add('hidden');
        this.elements.highlightVersesBtn.classList.add('hidden');
        this.elements.clearSearchBtn.classList.add('hidden');
        // Restore saved page position
        this.currentPage = this.position.page || 0;
        this.renderPage();
    }

    highlightAllPhrases() {
        if (this.searchResults.length === 0) return;
        this.saveUndoState();

        const color = this.settings.highlightColors[this.activeHighlightColorIndex];
        let highlightedCount = 0;

        this.searchResults.forEach(result => {
            // Get the full verse text to expand to word boundaries
            const verse = this.filteredScriptures.find(v => v.reference === result.reference);
            if (!verse) return;

            // Expand to word boundaries
            const expanded = this.expandToWordBoundaries(verse.text, result.start, result.end);

            if (!this.phraseHighlights[result.reference]) {
                this.phraseHighlights[result.reference] = [];
            }

            // Check if this expanded phrase highlight already exists
            const exists = this.phraseHighlights[result.reference].some(
                p => p.start === expanded.start && p.end === expanded.end
            );

            if (!exists) {
                this.phraseHighlights[result.reference].push({
                    id: Date.now() + Math.random(),
                    start: expanded.start,
                    end: expanded.end,
                    text: expanded.text,
                    color: color,
                    type: 'highlight',
                    timestamp: Date.now()
                });
                highlightedCount++;
            }
        });

        this.saveHighlights();
        this.showToast(`Highlighted ${highlightedCount} phrases!`);
        // Re-render to show new highlights while keeping search active
        this.renderPage();
    }

    highlightAllVerses() {
        if (this.searchResults.length === 0) return;
        this.saveUndoState();

        const color = this.settings.highlightColors[this.activeHighlightColorIndex];
        const uniqueRefs = [...new Set(this.searchResults.map(r => r.reference))];

        uniqueRefs.forEach(ref => {
            this.highlights[ref] = {
                color: color,
                timestamp: Date.now()
            };
        });

        this.saveHighlights();
        this.showToast(`Highlighted ${uniqueRefs.length} verses!`);
        // Re-render to show new highlights while keeping search active
        this.renderPage();
    }

    applySearchHighlight(html, originalText) {
        if (!this.searchTerm) return html;

        const term = this.searchTerm;
        const termLower = term.toLowerCase();

        // Use regex to find and highlight matches (case-insensitive)
        // We need to be careful not to replace inside HTML tags
        const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');

        // Split by HTML tags, process text parts only
        const parts = html.split(/(<[^>]+>)/);
        const result = parts.map(part => {
            // If it's an HTML tag, leave it alone
            if (part.startsWith('<')) return part;
            // Otherwise, apply search highlighting
            return part.replace(regex, '<span class="search-match">$1</span>');
        }).join('');

        return result;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    expandToWordBoundaries(text, start, end) {
        // Expand start backwards to word boundary
        while (start > 0 && /\w/.test(text[start - 1])) {
            start--;
        }
        // Expand end forwards to word boundary
        while (end < text.length && /\w/.test(text[end])) {
            end++;
        }
        return { start, end, text: text.substring(start, end) };
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ScriptureApp());
} else {
    new ScriptureApp();
}