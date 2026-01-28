// LDS Scripture Search & Highlighter - Comprehensive Implementation

class ScriptureApp {
    constructor() {
        // Data storage
        this.scriptures = [];
        this.filteredScriptures = [];
        this.displayScriptures = [];

        // Highlighting data
        this.verseHighlights = {}; // { verseId: 'green' | 'yellow' | 'pink' | 'purple' }
        this.phraseHighlights = {}; // { verseId: [{ text: string, color: string }] }

        // Search state
        this.currentSearchTerm = '';
        this.searchMatches = [];
        this.currentMatchIndex = -1;

        // Settings
        this.settings = {
            highlightColors: [
                { name: 'green', hex: '#c3e6cb' },
                { name: 'yellow', hex: '#fff3cd' },
                { name: 'pink', hex: '#f8d7da' },
                { name: 'purple', hex: '#e2d9f3' }
            ],
            activeColorIndex: 0,
            fontSize: 16,
            columnCount: 2
        };

        // Pagination
        this.currentPage = 0;
        this.versesPerPage = 100;
        this.totalPages = 0;

        // Navigation filters
        this.navFilters = {
            volume: '',
            book: '',
            chapter: '',
            verse: ''
        };

        // Debounce timer
        this.searchDebounceTimer = null;

        // Initialize
        this.init();
    }

    async init() {
        // Load saved data
        this.loadSettings();
        this.loadHighlights();

        // Setup UI
        this.setupEventListeners();
        this.renderPalette();
        this.updateFontDisplay();
        this.updateColumnDisplay();

        // Load scriptures
        await this.loadScriptures();

        // Populate navigation dropdowns
        this.populateNavigationFilters();

        // Initial render
        this.applyFilters();
    }

    // ===== SCRIPTURE LOADING =====
    async loadScriptures() {
        try {
            const response = await fetch('quad-normalized.txt');
            if (!response.ok) {
                throw new Error(`Failed to load scriptures: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            if (!text || text.trim().length === 0) {
                throw new Error('Scripture file is empty');
            }

            const lines = text.split('\n');

            this.scriptures = lines.map((line, index) => {
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    const ref = parts[0].trim();
                    const text = parts.slice(1).join('\t').trim();

                    // Parse reference: "Book Chapter:Verse"
                    const refMatch = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
                    if (refMatch) {
                        const book = refMatch[1].trim();
                        const chapter = parseInt(refMatch[2]);
                        const verse = parseInt(refMatch[3]);

                        return {
                            id: index,
                            ref: ref,
                            book: book,
                            chapter: chapter,
                            verse: verse,
                            text: text,
                            volume: this.getVolume(book)
                        };
                    }
                }
                return null;
            }).filter(v => v !== null);

            if (this.scriptures.length === 0) {
                throw new Error('No valid verses found in scripture file');
            }

            this.filteredScriptures = [...this.scriptures];
            console.log(`Loaded ${this.scriptures.length} verses`);
            this.updateStats();
        } catch (error) {
            console.error('Error loading scriptures:', error);
            document.getElementById('stats').textContent = `Error: ${error.message}`;
            document.getElementById('contentArea').innerHTML =
                '<div style="text-align: center; padding: 60px 20px; color: #e74c3c;"><h3>⚠️ Error Loading Scriptures</h3><p>' +
                error.message +
                '</p><p style="margin-top: 20px;">Please ensure quad-normalized.txt is in the same directory as index.html.</p></div>';
        }
    }

    getVolume(book) {
        const volumes = {
            ot: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'],
            nt: ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'],
            bom: ['1 Nephi', '2 Nephi', 'Jacob', 'Enos', 'Jarom', 'Omni', 'Words of Mormon', 'Mosiah', 'Alma', 'Helaman', '3 Nephi', '4 Nephi', 'Mormon', 'Ether', 'Moroni'],
            dc: ['Doctrine and Covenants'],
            pgp: ['Moses', 'Abraham', 'Joseph Smith--Matthew', 'Joseph Smith--History', 'Articles of Faith']
        };

        for (const [volume, books] of Object.entries(volumes)) {
            if (books.includes(book) || books.some(b => book.startsWith(b))) {
                return volume;
            }
        }
        return 'unknown';
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Search
        document.getElementById('searchInput').addEventListener('input', () => this.debouncedSearch());
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('clearSearchBtn').addEventListener('click', () => this.clearSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(this.searchDebounceTimer);
                this.performSearch();
            }
        });

        // Volume filters
        document.querySelectorAll('.volume-filter').forEach(cb => {
            cb.addEventListener('change', () => this.performSearch());
        });

        document.getElementById('caseSensitive').addEventListener('change', () => this.performSearch());
        document.getElementById('wholeWord').addEventListener('change', () => this.performSearch());
        document.getElementById('maxResults').addEventListener('change', () => this.performSearch());

        // Navigation filters
        document.getElementById('volumeSelect').addEventListener('change', () => this.handleNavFilterChange('volume'));
        document.getElementById('bookSelect').addEventListener('change', () => this.handleNavFilterChange('book'));
        document.getElementById('chapterSelect').addEventListener('change', () => this.handleNavFilterChange('chapter'));
        document.getElementById('verseSelect').addEventListener('change', () => this.handleNavFilterChange('verse'));

        // Font and column controls
        document.getElementById('decreaseFontBtn').addEventListener('click', () => this.adjustFontSize(-2));
        document.getElementById('increaseFontBtn').addEventListener('click', () => this.adjustFontSize(2));
        document.getElementById('decreaseColumnsBtn').addEventListener('click', () => this.adjustColumnCount(-1));
        document.getElementById('increaseColumnsBtn').addEventListener('click', () => this.adjustColumnCount(1));

        // Pagination
        document.getElementById('prevPageBtn').addEventListener('click', () => this.prevPage());
        document.getElementById('nextPageBtn').addEventListener('click', () => this.nextPage());

        // Highlight actions
        document.getElementById('highlightNextBtn').addEventListener('click', () => this.highlightNext());
        document.getElementById('highlightAllPageBtn').addEventListener('click', () => this.highlightAllOnPage());
        document.getElementById('highlightAllMatchesBtn').addEventListener('click', () => this.highlightAllMatches());
        document.getElementById('clearHighlightsBtn').addEventListener('click', () => this.clearAllHighlights());

        // Export/Import
        document.getElementById('exportHighlightsBtn').addEventListener('click', () => this.exportHighlights());
        document.getElementById('importHighlightsBtn').addEventListener('click', () => this.showImportModal());
        document.getElementById('closeImportBtn').addEventListener('click', () => this.hideImportModal());
        document.getElementById('cancelImportBtn').addEventListener('click', () => this.hideImportModal());
        document.getElementById('confirmImportBtn').addEventListener('click', () => this.importHighlights());

        // Modal backdrop click to close
        document.getElementById('importModal').addEventListener('click', (e) => {
            if (e.target.id === 'importModal') {
                this.hideImportModal();
            }
        });

        // Help modal
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelpModal());
        document.getElementById('closeHelpBtn').addEventListener('click', () => this.hideHelpModal());
        document.getElementById('closeHelpFooterBtn').addEventListener('click', () => this.hideHelpModal());
        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                this.hideHelpModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Text selection for phrase highlighting
        document.addEventListener('mouseup', (e) => this.handleTextSelection(e));
    }

    // ===== SEARCH =====
    debouncedSearch() {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => this.performSearch(), 300);
    }

    performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        this.currentSearchTerm = query;

        // Get active volume filters
        const activeVolumes = [];
        if (document.getElementById('filterOT').checked) activeVolumes.push('ot');
        if (document.getElementById('filterNT').checked) activeVolumes.push('nt');
        if (document.getElementById('filterBOM').checked) activeVolumes.push('bom');
        if (document.getElementById('filterDC').checked) activeVolumes.push('dc');
        if (document.getElementById('filterPGP').checked) activeVolumes.push('pgp');

        // Get search options
        const caseSensitive = document.getElementById('caseSensitive').checked;
        const wholeWord = document.getElementById('wholeWord').checked;
        const maxResults = parseInt(document.getElementById('maxResults').value);

        // Filter scriptures
        let results = this.scriptures;

        // Apply volume filter
        if (activeVolumes.length > 0) {
            results = results.filter(v => activeVolumes.includes(v.volume));
        }

        // Apply search query
        if (query) {
            let pattern;
            try {
                const flags = caseSensitive ? 'g' : 'gi';
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = wholeWord ? `\\b${escaped}\\b` : escaped;
                pattern = new RegExp(regex, flags);
            } catch (e) {
                console.error('Invalid search pattern', e);
                return;
            }

            results = results.filter(v => pattern.test(v.text) || pattern.test(v.ref));

            // Limit results
            if (results.length > maxResults) {
                results = results.slice(0, maxResults);
            }

            // Store matches for highlighting
            this.searchMatches = results.map(v => v.id);
            this.currentMatchIndex = -1;
        } else {
            this.searchMatches = [];
            this.currentMatchIndex = -1;
        }

        this.filteredScriptures = results;
        this.currentPage = 0;
        this.applyFilters();
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.currentSearchTerm = '';
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.performSearch();
    }

    // ===== NAVIGATION FILTERS =====
    populateNavigationFilters() {
        const volumeSelect = document.getElementById('volumeSelect');
        const volumes = ['Old Testament', 'New Testament', 'Book of Mormon', 'Doctrine & Covenants', 'Pearl of Great Price'];
        volumes.forEach(vol => {
            const option = document.createElement('option');
            option.value = vol;
            option.textContent = vol;
            volumeSelect.appendChild(option);
        });
    }

    handleNavFilterChange(filterType) {
        const volumeSelect = document.getElementById('volumeSelect');
        const bookSelect = document.getElementById('bookSelect');
        const chapterSelect = document.getElementById('chapterSelect');
        const verseSelect = document.getElementById('verseSelect');

        this.navFilters[filterType] = document.getElementById(`${filterType}Select`).value;

        // Update dependent dropdowns
        if (filterType === 'volume') {
            // Populate books
            bookSelect.innerHTML = '<option value="">All Books</option>';
            chapterSelect.innerHTML = '<option value="">All Chapters</option>';
            verseSelect.innerHTML = '<option value="">All Verses</option>';

            if (this.navFilters.volume) {
                const books = [...new Set(
                    this.scriptures
                        .filter(v => this.getVolumeDisplayName(v.volume) === this.navFilters.volume)
                        .map(v => v.book)
                )];
                books.forEach(book => {
                    const option = document.createElement('option');
                    option.value = book;
                    option.textContent = book;
                    bookSelect.appendChild(option);
                });
            }
        } else if (filterType === 'book') {
            // Populate chapters
            chapterSelect.innerHTML = '<option value="">All Chapters</option>';
            verseSelect.innerHTML = '<option value="">All Verses</option>';

            if (this.navFilters.book) {
                const chapters = [...new Set(
                    this.scriptures
                        .filter(v => v.book === this.navFilters.book)
                        .map(v => v.chapter)
                )].sort((a, b) => a - b);

                chapters.forEach(ch => {
                    const option = document.createElement('option');
                    option.value = ch;
                    option.textContent = ch;
                    chapterSelect.appendChild(option);
                });
            }
        } else if (filterType === 'chapter') {
            // Populate verses
            verseSelect.innerHTML = '<option value="">All Verses</option>';

            if (this.navFilters.chapter) {
                const verses = this.scriptures
                    .filter(v => v.book === this.navFilters.book && v.chapter === parseInt(this.navFilters.chapter))
                    .map(v => v.verse)
                    .sort((a, b) => a - b);

                verses.forEach(vs => {
                    const option = document.createElement('option');
                    option.value = vs;
                    option.textContent = vs;
                    verseSelect.appendChild(option);
                });
            }
        }

        this.applyFilters();
    }

    getVolumeDisplayName(volume) {
        const names = {
            ot: 'Old Testament',
            nt: 'New Testament',
            bom: 'Book of Mormon',
            dc: 'Doctrine & Covenants',
            pgp: 'Pearl of Great Price'
        };
        return names[volume] || volume;
    }

    applyFilters() {
        let results = [...this.filteredScriptures];

        // Apply navigation filters
        if (this.navFilters.volume) {
            results = results.filter(v => this.getVolumeDisplayName(v.volume) === this.navFilters.volume);
        }
        if (this.navFilters.book) {
            results = results.filter(v => v.book === this.navFilters.book);
        }
        if (this.navFilters.chapter) {
            results = results.filter(v => v.chapter === parseInt(this.navFilters.chapter));
        }
        if (this.navFilters.verse) {
            results = results.filter(v => v.verse === parseInt(this.navFilters.verse));
        }

        this.displayScriptures = results;
        this.totalPages = Math.ceil(results.length / this.versesPerPage);
        this.renderPage();
    }

    // ===== PAGINATION =====
    renderPage() {
        const start = this.currentPage * this.versesPerPage;
        const end = start + this.versesPerPage;
        const pageVerses = this.displayScriptures.slice(start, end);

        const contentArea = document.getElementById('contentArea');

        if (pageVerses.length === 0) {
            const hasSearch = this.currentSearchTerm ||
                             this.navFilters.volume ||
                             this.navFilters.book ||
                             this.navFilters.chapter ||
                             this.navFilters.verse;

            if (hasSearch) {
                contentArea.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: #999;"><h3>No verses found</h3><p>Try adjusting your search or filters.</p></div>';
            } else {
                contentArea.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; color: #666; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea; margin-bottom: 20px;">✨ Welcome to Scripture Search & Highlighter!</h2>
                        <p style="font-size: 1.1em; margin-bottom: 20px;">Explore the LDS Standard Works with powerful search and highlighting tools.</p>
                        <div style="text-align: left; margin-top: 30px;">
                            <p style="margin-bottom: 15px;"><strong>Quick Start:</strong></p>
                            <p style="margin-bottom: 10px;">📝 <strong>Search:</strong> Type "faith" or "love" in the search box above</p>
                            <p style="margin-bottom: 10px;">🎨 <strong>Highlight:</strong> Click any verse to highlight it</p>
                            <p style="margin-bottom: 10px;">🖱️ <strong>Select text:</strong> Drag to highlight specific phrases</p>
                            <p style="margin-bottom: 10px;">📖 <strong>Browse:</strong> Use the dropdowns to navigate by volume/book/chapter</p>
                            <p style="margin-top: 20px; text-align: center;"><button onclick="app.showHelpModal()" style="background: #667eea; color: white; padding: 12px 30px; border: none; border-radius: 8px; font-size: 1em; cursor: pointer; font-weight: 600;">View Full Guide</button></p>
                        </div>
                    </div>
                `;
            }
            this.updateStats();
            return;
        }

        // Create verses container with column layout
        const container = document.createElement('div');
        container.className = 'verses-container';
        container.style.fontSize = `${this.settings.fontSize}px`;
        container.style.columnCount = this.settings.columnCount;

        pageVerses.forEach(verse => {
            const verseEl = this.createVerseElement(verse);
            container.appendChild(verseEl);
        });

        contentArea.innerHTML = '';
        contentArea.appendChild(container);

        // Update pagination controls
        document.getElementById('pageIndicator').textContent = `Page ${this.currentPage + 1} of ${this.totalPages || 1}`;
        document.getElementById('prevPageBtn').disabled = this.currentPage === 0;
        document.getElementById('nextPageBtn').disabled = this.currentPage >= this.totalPages - 1;

        this.updateStats();
    }

    createVerseElement(verse) {
        const div = document.createElement('div');
        div.className = 'verse';
        div.dataset.id = verse.id;

        // Apply verse highlight
        if (this.verseHighlights[verse.id]) {
            div.classList.add(`highlight-${this.verseHighlights[verse.id]}`);
        }

        // Create reference
        const refSpan = document.createElement('span');
        refSpan.className = 'verse-ref';
        refSpan.textContent = verse.ref;

        // Create text with search highlighting
        const textSpan = document.createElement('span');
        textSpan.className = 'verse-text';

        let displayText = verse.text;

        // Apply phrase highlights first (so search highlights can overlay them)
        if (this.phraseHighlights[verse.id]) {
            this.phraseHighlights[verse.id].forEach(({ text, color }) => {
                const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(escaped, 'gi');
                // Only replace if not already in a highlight tag
                displayText = displayText.replace(pattern, match =>
                    `<span class="phrase-highlight ${color}">${match}</span>`
                );
            });
        }

        // Apply search highlighting (will overlay phrase highlights)
        if (this.currentSearchTerm) {
            const caseSensitive = document.getElementById('caseSensitive').checked;
            const wholeWord = document.getElementById('wholeWord').checked;
            const escaped = this.currentSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = wholeWord ? `\\b${escaped}\\b` : escaped;
            const pattern = new RegExp(regex, caseSensitive ? 'g' : 'gi');
            displayText = displayText.replace(pattern, match => `<mark>${match}</mark>`);
        }

        textSpan.innerHTML = displayText;

        div.appendChild(refSpan);
        div.appendChild(textSpan);

        // Click to highlight verse
        div.addEventListener('click', (e) => {
            // Don't trigger if clicking on text selection
            if (window.getSelection().toString()) return;
            this.cycleVerseHighlight(verse.id);
        });

        return div;
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderPage();
            window.scrollTo(0, 0);
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.renderPage();
            window.scrollTo(0, 0);
        }
    }

    // ===== VERSE HIGHLIGHTING =====
    cycleVerseHighlight(verseId) {
        const colors = this.settings.highlightColors.map(c => c.name);
        const currentColor = this.verseHighlights[verseId];

        if (!currentColor) {
            // Apply active color
            const activeColor = colors[this.settings.activeColorIndex];
            this.verseHighlights[verseId] = activeColor;
        } else {
            // Cycle to next color
            const currentIndex = colors.indexOf(currentColor);
            const nextIndex = (currentIndex + 1) % colors.length;

            if (nextIndex === 0) {
                // Remove highlight after cycling through all colors
                delete this.verseHighlights[verseId];
            } else {
                this.verseHighlights[verseId] = colors[nextIndex];
            }
        }

        this.saveHighlights();
        this.renderPage();
    }

    // ===== PHRASE HIGHLIGHTING =====
    handleTextSelection(e) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length > 2) {
            // Find which verse this selection is in
            let node = selection.anchorNode;
            while (node && !node.classList?.contains('verse')) {
                node = node.parentNode;
            }

            if (node && node.dataset.id) {
                const verseId = parseInt(node.dataset.id);
                const activeColor = this.settings.highlightColors[this.settings.activeColorIndex].name;

                // Add phrase highlight
                if (!this.phraseHighlights[verseId]) {
                    this.phraseHighlights[verseId] = [];
                }

                // Check if already highlighted
                const exists = this.phraseHighlights[verseId].some(ph => ph.text === selectedText);
                if (!exists) {
                    this.phraseHighlights[verseId].push({ text: selectedText, color: activeColor });
                    this.saveHighlights();

                    // Re-render to show highlight
                    setTimeout(() => {
                        this.renderPage();
                        selection.removeAllRanges();
                        this.showNotification(`✓ Phrase highlighted: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`, 'success');
                    }, 100);
                }
            }
        }
    }

    // ===== HIGHLIGHT NEXT/ALL =====
    highlightNext() {
        if (this.searchMatches.length === 0) {
            this.showNotification('⚠️ Please perform a search first', 'warning');
            return;
        }

        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
        const verseId = this.searchMatches[this.currentMatchIndex];
        const activeColor = this.settings.highlightColors[this.settings.activeColorIndex].name;

        this.verseHighlights[verseId] = activeColor;
        this.saveHighlights();

        // Find page containing this verse
        const verseIndex = this.displayScriptures.findIndex(v => v.id === verseId);
        if (verseIndex !== -1) {
            this.currentPage = Math.floor(verseIndex / this.versesPerPage);
        }

        this.renderPage();
        this.showNotification(`✓ Highlighted result ${this.currentMatchIndex + 1} of ${this.searchMatches.length}`, 'success');
    }

    highlightAllOnPage() {
        if (this.searchMatches.length === 0) {
            this.showNotification('⚠️ Please perform a search first', 'warning');
            return;
        }

        const start = this.currentPage * this.versesPerPage;
        const end = start + this.versesPerPage;
        const pageVerses = this.displayScriptures.slice(start, end);
        const activeColor = this.settings.highlightColors[this.settings.activeColorIndex].name;

        let count = 0;
        pageVerses.forEach(verse => {
            if (this.searchMatches.includes(verse.id)) {
                this.verseHighlights[verse.id] = activeColor;
                count++;
            }
        });

        this.saveHighlights();
        this.renderPage();
        this.showNotification(`✓ Highlighted ${count} verse${count !== 1 ? 's' : ''} on this page`, 'success');
    }

    highlightAllMatches() {
        if (this.searchMatches.length === 0) {
            this.showNotification('⚠️ Please perform a search first', 'warning');
            return;
        }

        const activeColor = this.settings.highlightColors[this.settings.activeColorIndex].name;
        this.searchMatches.forEach(verseId => {
            this.verseHighlights[verseId] = activeColor;
        });

        this.saveHighlights();
        this.renderPage();
        this.showNotification(`✓ Highlighted all ${this.searchMatches.length} search results`, 'success');
    }

    clearAllHighlights() {
        if (confirm('Clear all highlights and phrase selections?')) {
            this.verseHighlights = {};
            this.phraseHighlights = {};
            this.saveHighlights();
            this.renderPage();
        }
    }

    // ===== PALETTE =====
    renderPalette() {
        const paletteColors = document.getElementById('paletteColors');
        paletteColors.innerHTML = '';

        this.settings.highlightColors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color.hex;
            swatch.title = color.name;

            if (index === this.settings.activeColorIndex) {
                swatch.classList.add('active');
            }

            swatch.addEventListener('click', () => {
                this.settings.activeColorIndex = index;
                this.saveSettings();
                this.renderPalette();
            });

            paletteColors.appendChild(swatch);
        });
    }

    // ===== FONT & COLUMN CONTROLS =====
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

    updateFontDisplay() {
        document.getElementById('fontSizeDisplay').textContent = `${this.settings.fontSize}px`;
    }

    updateColumnDisplay() {
        document.getElementById('columnCountDisplay').textContent = this.settings.columnCount;
    }

    // ===== KEYBOARD SHORTCUTS =====
    handleKeyboard(e) {
        // ESC key closes modals
        if (e.key === 'Escape') {
            const importModal = document.getElementById('importModal');
            const helpModal = document.getElementById('helpModal');

            if (!importModal.classList.contains('hidden')) {
                this.hideImportModal();
                return;
            }

            if (!helpModal.classList.contains('hidden')) {
                this.hideHelpModal();
                return;
            }
        }

        // Ignore if typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.prevPage();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.nextPage();
                break;
        }
    }

    // ===== EXPORT/IMPORT =====
    exportHighlights() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            verseHighlights: this.verseHighlights,
            phraseHighlights: this.phraseHighlights,
            settings: this.settings
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scripture-highlights-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showImportModal() {
        document.getElementById('importModal').classList.remove('hidden');
        document.getElementById('importTextarea').value = '';
    }

    hideImportModal() {
        document.getElementById('importModal').classList.add('hidden');
    }

    showHelpModal() {
        document.getElementById('helpModal').classList.remove('hidden');
    }

    hideHelpModal() {
        document.getElementById('helpModal').classList.add('hidden');
    }

    importHighlights() {
        const json = document.getElementById('importTextarea').value;
        try {
            const data = JSON.parse(json);

            if (data.verseHighlights) {
                this.verseHighlights = data.verseHighlights;
            }
            if (data.phraseHighlights) {
                this.phraseHighlights = data.phraseHighlights;
            }
            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
                this.updateFontDisplay();
                this.updateColumnDisplay();
                this.renderPalette();
            }

            this.saveHighlights();
            this.saveSettings();
            this.renderPage();
            this.hideImportModal();
            alert('Highlights imported successfully!');
        } catch (e) {
            alert('Invalid JSON format. Please check your import data.');
            console.error('Import error:', e);
        }
    }

    // ===== LOCALSTORAGE =====
    loadSettings() {
        const saved = localStorage.getItem('scripture_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.settings = { ...this.settings, ...settings };
            } catch (e) {
                console.error('Error loading settings', e);
            }
        }
    }

    saveSettings() {
        localStorage.setItem('scripture_settings', JSON.stringify(this.settings));
    }

    loadHighlights() {
        const savedVerseHighlights = localStorage.getItem('scripture_verse_highlights');
        const savedPhraseHighlights = localStorage.getItem('scripture_phrase_highlights');

        if (savedVerseHighlights) {
            try {
                this.verseHighlights = JSON.parse(savedVerseHighlights);
            } catch (e) {
                console.error('Error loading verse highlights', e);
            }
        }

        if (savedPhraseHighlights) {
            try {
                this.phraseHighlights = JSON.parse(savedPhraseHighlights);
            } catch (e) {
                console.error('Error loading phrase highlights', e);
            }
        }
    }

    saveHighlights() {
        localStorage.setItem('scripture_verse_highlights', JSON.stringify(this.verseHighlights));
        localStorage.setItem('scripture_phrase_highlights', JSON.stringify(this.phraseHighlights));
    }

    // ===== STATS =====
    updateStats() {
        const statsEl = document.getElementById('stats');
        const total = this.scriptures.length;
        const filtered = this.displayScriptures.length;

        if (this.currentSearchTerm) {
            statsEl.textContent = `Found ${filtered} of ${total} verses matching "${this.currentSearchTerm}"`;
        } else if (filtered < total) {
            statsEl.textContent = `Showing ${filtered} of ${total} verses`;
        } else {
            statsEl.textContent = `Loaded ${total} verses from LDS Standard Works`;
        }
    }

    // ===== NOTIFICATIONS =====
    showNotification(message, type = 'info') {
        // Remove existing notification if present
        const existing = document.querySelector('.notification-toast');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification-toast notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScriptureApp();
});
