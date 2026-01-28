// LDS Scripture Search & Highlighter v2

class ScriptureSearchHighlighter {
    constructor() {
        this.scriptures = [];
        this.filteredScriptures = [];
        this.highlights = {};
        this.phraseHighlights = {};
        this.currentSearchTerm = '';
        this.currentMatches = [];
        this.matchIndex = -1;
        this.settings = {
            highlightColors: ['#c3e6cb', '#fff3cd', '#f8d7da', '#e2d9f3'],
            activeColorIndex: 0,
            fontSize: 16,
            columnCount: 2
        };
        this.currentPage = 0;
        this.versesPerPage = 100; // Adjust as needed
        this.totalPages = 0;
        this.filteredScriptures = [];
        this.filters = {
            volume: '',
            book: '',
            chapter: '',
            verse: ''
        };

        this.elements = {
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            clearSearchBtn: document.getElementById('clearSearchBtn'),
            stats: document.getElementById('stats'),
            contentArea: document.getElementById('contentArea'),
            paletteColors: document.getElementById('paletteColors'),
            highlightNextBtn: document.getElementById('highlightNextBtn'),
            highlightAllPageBtn: document.getElementById('highlightAllPageBtn'),
            highlightAllMatchesBtn: document.getElementById('highlightAllMatchesBtn'),
            clearHighlightsBtn: document.getElementById('clearHighlightsBtn'),
            exportHighlightsBtn: document.getElementById('exportHighlightsBtn'),
            importHighlightsBtn: document.getElementById('importHighlightsBtn'),
            importModal: document.getElementById('importModal'),
            importTextarea: document.getElementById('importTextarea'),
            closeImportBtn: document.getElementById('closeImportBtn'),
            confirmImportBtn: document.getElementById('confirmImportBtn'),
            cancelImportBtn: document.getElementById('cancelImportBtn'),
            // New elements
            volumeSelect: document.getElementById('volumeSelect'),
            bookSelect: document.getElementById('bookSelect'),
            chapterSelect: document.getElementById('chapterSelect'),
            verseSelect: document.getElementById('verseSelect'),
            decreaseFontBtn: document.getElementById('decreaseFontBtn'),
            increaseFontBtn: document.getElementById('increaseFontBtn'),
            fontSizeDisplay: document.getElementById('fontSizeDisplay'),
            decreaseColumnsBtn: document.getElementById('decreaseColumnsBtn'),
            increaseColumnsBtn: document.getElementById('increaseColumnsBtn'),
            columnCountDisplay: document.getElementById('columnCountDisplay'),
            prevPageBtn: document.getElementById('prevPageBtn'),
            nextPageBtn: document.getElementById('nextPageBtn'),
            pageIndicator: document.getElementById('pageIndicator')
        };

        // Volume filters
        this.volumeFilters = {
            bible: document.getElementById('filterBible'),
            bom: document.getElementById('filterBoM'),
            dc: document.getElementById('filterDC'),
            pgp: document.getElementById('filterPGP')
        };

        this.caseSensitive = document.getElementById('caseSensitive');
        this.wholeWord = document.getElementById('wholeWord');
        this.maxResults = document.getElementById('maxResults');

        this.init();
    }

    async init() {
        this.loadSettings();
        this.loadHighlights();
        this.setupEventListeners();
        this.renderPalette();
        this.updateFontDisplay();
        this.updateColumnDisplay();
        await this.loadScriptures();
        this.populateFilters();
        this.applyFilters();
        this.renderPage();
    }

    async loadScriptures() {
        try {
            const response = await fetch('lds-scriptures.txt');
            const text = await response.text();
            this.scriptures = text.split('\n').filter(line => line.trim()).map((line, index) => {
                // Find the first occurrence of space after a digit:digit pattern
                const match = line.match(/^(.+?\d+:\d+)\s+(.+)$/);
                if (match) {
                    return { id: index, ref: match[1], text: match[2], full: line };
                } else {
                    // Fallback
                    const parts = line.split(' ');
                    const ref = parts.slice(0, 2).join(' '); // Assume first two parts are ref
                    const text = parts.slice(2).join(' ');
                    return { id: index, ref, text, full: line };
                }
            });
            this.filteredScriptures = [...this.scriptures];
            this.updateStats();
        } catch (error) {
            console.error('Error loading scriptures:', error);
            this.elements.stats.textContent = 'Error loading scriptures';
        }
    }

    setupEventListeners() {
        this.elements.searchInput.addEventListener('input', () => this.performSearch());
        this.elements.searchBtn.addEventListener('click', () => this.performSearch());
        this.elements.clearSearchBtn.addEventListener('click', () => this.clearSearch());

        Object.values(this.volumeFilters).forEach(cb => cb.addEventListener('change', () => this.performSearch()));
        this.caseSensitive.addEventListener('change', () => this.performSearch());
        this.wholeWord.addEventListener('change', () => this.performSearch());
        this.maxResults.addEventListener('change', () => this.performSearch());

        this.elements.highlightNextBtn.addEventListener('click', () => this.highlightNext());
        this.elements.highlightAllPageBtn.addEventListener('click', () => this.highlightAllOnPage());
        this.elements.highlightAllMatchesBtn.addEventListener('click', () => this.highlightAllMatches());
        this.elements.clearHighlightsBtn.addEventListener('click', () => this.clearHighlights());
        this.elements.exportHighlightsBtn.addEventListener('click', () => this.exportHighlights());
        this.elements.importHighlightsBtn.addEventListener('click', () => this.showImportModal());

        this.elements.closeImportBtn.addEventListener('click', () => this.hideImportModal());
        this.elements.cancelImportBtn.addEventListener('click', () => this.hideImportModal());
        this.elements.confirmImportBtn.addEventListener('click', () => this.importHighlights());

        // New event listeners
        this.elements.volumeSelect.addEventListener('change', () => this.handleFilterChange());
        this.elements.bookSelect.addEventListener('change', () => this.handleFilterChange());
        this.elements.chapterSelect.addEventListener('change', () => this.handleFilterChange());
        this.elements.verseSelect.addEventListener('change', () => this.handleFilterChange());

        this.elements.decreaseFontBtn.addEventListener('click', () => this.adjustFontSize(-2));
        this.elements.increaseFontBtn.addEventListener('click', () => this.adjustFontSize(2));
        this.elements.decreaseColumnsBtn.addEventListener('click', () => this.adjustColumnCount(-1));
        this.elements.increaseColumnsBtn.addEventListener('click', () => this.adjustColumnCount(1));

        this.elements.prevPageBtn.addEventListener('click', () => this.prevPage());
        this.elements.nextPageBtn.addEventListener('click', () => this.nextPage());

        this.elements.contentArea.addEventListener('click', (e) => this.handleVerseClick(e));
        this.elements.contentArea.addEventListener('mouseup', (e) => this.handleTextSelection(e));
    }

    performSearch() {
        const term = this.elements.searchInput.value.trim();
        this.currentSearchTerm = term;

        if (term) {
            const volumes = Object.keys(this.volumeFilters).filter(v => this.volumeFilters[v].checked);
            const caseSens = this.caseSensitive.checked;
            const whole = this.wholeWord.checked;
            const max = parseInt(this.maxResults.value);

            // Pre-filter by search volumes and text
            this.filteredScriptures = this.scriptures.filter(scripture => {
                // Check volume
                const book = this.extractBook(scripture.ref);
                const volume = this.getVolume(book);
                if (!volumes.includes(volume)) return false;

                // Check text match
                let text = scripture.text;
                let searchTerm = term;
                if (!caseSens) {
                    text = text.toLowerCase();
                    searchTerm = searchTerm.toLowerCase();
                }
                if (whole) {
                    const regex = new RegExp(`\\b${this.escapeRegex(searchTerm)}\\b`);
                    return regex.test(text);
                } else {
                    return text.includes(searchTerm);
                }
            }).slice(0, max);
        } else {
            this.filteredScriptures = [...this.scriptures];
        }

        this.findMatches();
        this.applyFilters();
        this.renderPage();
        this.updateStats();
    }

    clearSearch() {
        this.elements.searchInput.value = '';
        this.currentSearchTerm = '';
        this.currentMatches = [];
        this.matchIndex = -1;
        this.filteredScriptures = [...this.scriptures];
        this.applyFilters();
        this.renderPage();
        this.updateStats();
    }

    findMatches() {
        if (!this.currentSearchTerm) {
            this.currentMatches = [];
            return;
        }

        this.currentMatches = [];
        const flags = this.caseSensitive.checked ? 'g' : 'gi';
        const pattern = this.wholeWord.checked ? `\\b${this.escapeRegex(this.currentSearchTerm)}\\b` : this.escapeRegex(this.currentSearchTerm);
        const regex = new RegExp(pattern, flags);

        this.filteredScriptures.forEach(scripture => {
            let match;
            while ((match = regex.exec(scripture.text)) !== null) {
                this.currentMatches.push({
                    scriptureId: scripture.id,
                    start: match.index,
                    end: match.index + match[0].length
                });
            }
        });
        this.matchIndex = -1;
    }

    highlightNext() {
        if (this.currentMatches.length === 0) return;
        this.matchIndex = (this.matchIndex + 1) % this.currentMatches.length;
        const match = this.currentMatches[this.matchIndex];
        // Find which page the match is on
        const matchIndex = this.filteredScriptures.findIndex(s => s.id === match.scriptureId);
        const targetPage = Math.floor(matchIndex / this.versesPerPage);
        if (targetPage !== this.currentPage) {
            this.currentPage = targetPage;
            this.renderPage();
        }
        this.scrollToMatch(match);
    }

    highlightAllOnPage() {
        // Highlight all matches in currently displayed scriptures
        this.filteredScriptures.forEach(scripture => {
            const verseEl = document.querySelector(`[data-id="${scripture.id}"]`);
            if (verseEl) {
                this.highlightTextInElement(verseEl, scripture.text, this.currentSearchTerm, this.settings.highlightColors[this.settings.activeColorIndex]);
            }
        });
    }

    highlightAllMatches() {
        // Highlight all matches found
        this.currentMatches.forEach(match => {
            const verseEl = document.querySelector(`[data-id="${match.scriptureId}"]`);
            if (verseEl) {
                const scripture = this.scriptures.find(s => s.id === match.scriptureId);
                this.highlightTextInElement(verseEl, scripture.text, this.currentSearchTerm, this.settings.highlightColors[this.settings.activeColorIndex]);
            }
        });
    }

    highlightTextInElement(element, text, term, color) {
        const textEl = element.querySelector('.verse-text');
        if (textEl) {
            const regex = new RegExp(`(${this.escapeRegex(term)})`, this.caseSensitive.checked ? 'gi' : 'gi');
            textEl.innerHTML = text.replace(regex, `<span class="phrase-highlight" style="background-color: ${color}">$1</span>`);
        }
    }

    scrollToMatch(match) {
        const verseEl = document.querySelector(`[data-id="${match.scriptureId}"]`);
        if (verseEl) {
            verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Temporarily add a class for highlighting
            verseEl.classList.add('temp-highlight');
            setTimeout(() => verseEl.classList.remove('temp-highlight'), 2000);
        }
    }

    renderScriptures() {
        this.elements.contentArea.innerHTML = '<div class="scripture-columns">' +
            this.filteredScriptures.map(scripture => 
                `<div class="verse" data-id="${scripture.id}"><span class="verse-ref">${scripture.ref}</span><span class="verse-text">${scripture.text}</span></div>`
            ).join('') + '</div>';
        this.updateVerseHighlights();
    }

    handleVerseClick(e) {
        if (e.target.classList.contains('verse')) {
            const verseId = e.target.dataset.id;
            this.toggleVerseHighlight(verseId);
        }
    }

    handleTextSelection(e) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().trim()) {
            const range = selection.getRangeAt(0);
            this.highlightPhrase(range);
        }
    }

    toggleVerseHighlight(verseId) {
        const colorIndex = this.settings.activeColorIndex;
        const color = this.settings.highlightColors[colorIndex];
        const colorClass = ['green', 'yellow', 'pink', 'purple'][colorIndex] || 'green';
        if (this.highlights[verseId]) {
            delete this.highlights[verseId];
        } else {
            this.highlights[verseId] = { colorIndex, colorClass };
        }
        this.saveHighlights();
        this.updateVerseHighlights();
    }

    highlightPhrase(range) {
        // Implement phrase highlighting
        const color = this.settings.highlightColors[this.settings.activeColorIndex];
        // For simplicity, we'll highlight the selected text
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.className = 'phrase-highlight';
        range.surroundContents(span);
        // Save phrase highlights - this would need more implementation
    }

    updateVerseHighlights() {
        // First, remove all highlight classes
        document.querySelectorAll('.verse.highlight').forEach(el => {
            el.classList.remove('highlight', 'green', 'yellow', 'pink', 'purple');
        });
        // Then add highlights
        Object.keys(this.highlights).forEach(id => {
            const el = document.querySelector(`[data-id="${id}"]`);
            if (el) {
                el.classList.add('highlight', this.highlights[id].colorClass);
            }
        });
    }

    clearHighlights() {
        this.highlights = {};
        this.phraseHighlights = {};
        this.saveHighlights();
        this.renderPage();
    }

    exportHighlights() {
        const data = {
            highlights: this.highlights,
            phraseHighlights: this.phraseHighlights,
            settings: this.settings
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scripture-highlights.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    showImportModal() {
        this.elements.importModal.classList.remove('hidden');
    }

    hideImportModal() {
        this.elements.importModal.classList.add('hidden');
    }

    importHighlights() {
        try {
            const data = JSON.parse(this.elements.importTextarea.value);
            this.highlights = data.highlights || {};
            this.phraseHighlights = data.phraseHighlights || {};
            this.settings = { ...this.settings, ...data.settings };
            this.saveHighlights();
            this.saveSettings();
            this.renderPalette();
            this.renderPage();
            this.updateVerseHighlights();
            this.hideImportModal();
        } catch (error) {
            alert('Invalid JSON data');
        }
    }

    renderPalette() {
        this.elements.paletteColors.innerHTML = this.settings.highlightColors.map((color, index) => 
            `<div class="color-swatch ${index === this.settings.activeColorIndex ? 'active' : ''}" style="background-color: ${color}" data-index="${index}"></div>`
        ).join('');
        
        // Remove existing listeners
        this.elements.paletteColors.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.removeEventListener('click', this.paletteClickHandler);
        });
        
        // Add new listeners
        this.paletteClickHandler = (e) => {
            this.settings.activeColorIndex = parseInt(e.target.dataset.index);
            this.renderPalette();
        };
        this.elements.paletteColors.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', this.paletteClickHandler);
        });
    }

    updateStats() {
        const total = this.scriptures.length;
        const filtered = this.filteredScriptures.length;
        const matches = this.currentMatches.length;
        this.elements.stats.textContent = `Showing ${filtered} of ${total} verses${this.currentSearchTerm ? `, ${matches} matches for "${this.currentSearchTerm}"` : ''}`;
    }

    extractBook(ref) {
        // ref is like "Genesis 1:1" or "1 Nephi 1:1" or "Doctrine and Covenants 1:1"
        const parts = ref.split(' ');
        if (parts[0] === 'Doctrine' && parts[1] === 'and' && parts[2] === 'Covenants') return 'Doctrine and Covenants';
        if (parts[0] === 'Joseph' && parts[1] === 'Smith--Matthew') return 'Joseph Smith--Matthew';
        if (parts[0] === 'Joseph' && parts[1] === 'Smith--History') return 'Joseph Smith--History';
        if (parts[0] === 'Articles' && parts[1] === 'of' && parts[2] === 'Faith') return 'Articles of Faith';
        if (parts[0] === 'Words' && parts[1] === 'of' && parts[2] === 'Mormon') return 'Words of Mormon';
        if (parts[0] === 'Song' && parts[1] === 'of' && parts[2] === 'Solomon') return 'Song of Solomon';
        // For most, it's the first part or first two if number
        if (parts.length > 1 && /^\d/.test(parts[1])) {
            return parts[0];
        } else if (parts.length > 2 && /^\d/.test(parts[2])) {
            return parts.slice(0, 2).join(' ');
        }
        return parts[0];
    }

    getVolume(book) {
        const bibleBooks = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
        const bomBooks = ['1 Nephi', '2 Nephi', 'Jacob', 'Enos', 'Jarom', 'Omni', 'Words of Mormon', 'Mosiah', 'Alma', 'Helaman', '3 Nephi', '4 Nephi', 'Mormon', 'Ether', 'Moroni'];
        const dcBooks = ['Doctrine and Covenants', 'D&C'];
        const pgpBooks = ['Moses', 'Abraham', 'Joseph Smith--Matthew', 'Joseph Smith--History', 'Articles of Faith'];

        if (bibleBooks.includes(book)) return 'bible';
        if (bomBooks.includes(book)) return 'book-of-mormon';
        if (dcBooks.includes(book)) return 'doctrine-and-covenants';
        if (pgpBooks.includes(book)) return 'pearl-of-great-price';
        return 'unknown';
    }

    populateFilters() {
        // Populate volume select
        const volumeMap = {
            'Bible': 'bible',
            'Book of Mormon': 'bom',
            'Doctrine and Covenants': 'dc',
            'Pearl of Great Price': 'pgp'
        };
        const volumes = ['All Volumes', 'Bible', 'Book of Mormon', 'Doctrine and Covenants', 'Pearl of Great Price'];
        volumes.forEach(volume => {
            const option = document.createElement('option');
            option.value = volume === 'All Volumes' ? '' : volumeMap[volume] || volume.toLowerCase().replace(/ /g, '-');
            option.textContent = volume;
            this.elements.volumeSelect.appendChild(option);
        });

        // Populate book select
        const books = new Set(this.scriptures.map(s => this.extractBook(s.ref)));
        const bookOptions = ['All Books', ...Array.from(books).sort()];
        bookOptions.forEach(book => {
            const option = document.createElement('option');
            option.value = book === 'All Books' ? '' : book;
            option.textContent = book;
            this.elements.bookSelect.appendChild(option);
        });

        // Chapters and verses will be populated dynamically when book is selected
    }

    handleFilterChange() {
        this.filters.volume = this.elements.volumeSelect.value;
        this.filters.book = this.elements.bookSelect.value;
        this.filters.chapter = this.elements.chapterSelect.value;
        this.filters.verse = this.elements.verseSelect.value;

        // If book changed, populate chapters and verses
        if (this.filters.book) {
            this.populateChaptersAndVerses();
        } else {
            this.clearChaptersAndVerses();
        }

        this.currentPage = 0;
        this.applyFilters();
        this.renderPage();
    }

    populateChaptersAndVerses() {
        const bookScriptures = this.scriptures.filter(s => this.extractBook(s.ref) === this.filters.book);
        const chapters = new Set();
        const verses = new Set();

        bookScriptures.forEach(scripture => {
            const parts = scripture.ref.split(':');
            const chapter = parts[0].split(' ').pop();
            const verse = parts[1];
            chapters.add(chapter);
            verses.add(verse);
        });

        // Populate chapter select
        this.elements.chapterSelect.innerHTML = '<option value="">All Chapters</option>';
        Array.from(chapters).sort((a,b) => parseInt(a) - parseInt(b)).forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = chapter;
            this.elements.chapterSelect.appendChild(option);
        });

        // Populate verse select
        this.elements.verseSelect.innerHTML = '<option value="">All Verses</option>';
        Array.from(verses).sort((a,b) => parseInt(a) - parseInt(b)).forEach(verse => {
            const option = document.createElement('option');
            option.value = verse;
            option.textContent = verse;
            this.elements.verseSelect.appendChild(option);
        });
    }

    clearChaptersAndVerses() {
        this.elements.chapterSelect.innerHTML = '<option value="">All Chapters</option>';
        this.elements.verseSelect.innerHTML = '<option value="">All Verses</option>';
    }

    applyFilters() {
        let filtered = this.filteredScriptures;

        filtered = filtered.filter(scripture => {
            if (this.filters.volume && this.getVolume(this.extractBook(scripture.ref)) !== this.filters.volume) return false;
            if (this.filters.book && this.extractBook(scripture.ref) !== this.filters.book) return false;
            if (this.filters.chapter) {
                const chapter = scripture.ref.split(':')[0].split(' ').pop();
                if (chapter !== this.filters.chapter) return false;
            }
            if (this.filters.verse) {
                const verse = scripture.ref.split(':')[1];
                if (verse !== this.filters.verse) return false;
            }
            return true;
        });

        this.filteredScriptures = filtered;
        this.totalPages = Math.ceil(this.filteredScriptures.length / this.versesPerPage);
        this.updateStats();
    }

    renderPage() {
        const start = this.currentPage * this.versesPerPage;
        const end = start + this.versesPerPage;
        const pageScriptures = this.filteredScriptures.slice(start, end);

        this.elements.contentArea.innerHTML = `<div class="scripture-columns cols-${this.settings.columnCount} font-${this.settings.fontSize}">` +
            pageScriptures.map(scripture => 
                `<div class="verse" data-id="${scripture.id}"><span class="verse-ref">${scripture.ref}</span><span class="verse-text">${scripture.text}</span></div>`
            ).join('') + '</div>';
        this.updateVerseHighlights();
        this.updatePageIndicator();
    }

    updateFontDisplay() {
        this.elements.fontSizeDisplay.textContent = `${this.settings.fontSize}px`;
    }

    updateColumnDisplay() {
        this.elements.columnCountDisplay.textContent = this.settings.columnCount;
    }

    adjustFontSize(delta) {
        this.settings.fontSize = Math.max(12, Math.min(24, this.settings.fontSize + delta));
        this.saveSettings();
        this.updateFontDisplay();
        this.renderPage();
    }

    adjustColumnCount(delta) {
        this.settings.columnCount = Math.max(1, Math.min(6, this.settings.columnCount + delta));
        this.saveSettings();
        this.updateColumnDisplay();
        this.renderPage();
    }

    updatePageIndicator() {
        this.elements.pageIndicator.textContent = `Page ${this.currentPage + 1} of ${this.totalPages || 1}`;
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderPage();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.renderPage();
        }
    }

    loadSettings() {
        const saved = localStorage.getItem('scriptureSettings');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.settings = { ...this.settings, ...data };
            } catch (e) {
                console.error('Failed to parse scriptureSettings:', e);
            }
        }
    }

    saveSettings() {
        localStorage.setItem('scriptureSettings', JSON.stringify(this.settings));
    }

    loadHighlights() {
        const saved = localStorage.getItem('scriptureHighlights');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.highlights = data.highlights || {};
                this.phraseHighlights = data.phraseHighlights || {};
            } catch (e) {
                console.error('Failed to parse scriptureHighlights:', e);
            }
        }
    }

    saveHighlights() {
        const data = {
            highlights: this.highlights,
            phraseHighlights: this.phraseHighlights
        };
        localStorage.setItem('scriptureHighlights', JSON.stringify(data));
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ScriptureSearchHighlighter();
});
