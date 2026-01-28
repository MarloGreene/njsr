// LDS Scripture Highlighter Application
//
// Features:
// - Two-column scripture view with minimal chapter/verse markings
// - Click/drag to highlight verses or phrases, with color cycling
// - Customizable palette, import/export, persistent localStorage
// - Responsive, accessible, privacy-focused, no frameworks
//
// Main entry: ScriptureApp class (instantiated on DOMContentLoaded)
//
// For details, see README.md and ROADMAP.md
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
            importTextarea: document.getElementById('importTextarea')
        };

        // Data
        this.scriptures = [];
        this.highlights = {};
        this.phraseHighlights = {};
        this.highlightApplyMode = 'cycle'; // 'cycle' or 'direct'
        this.activeHighlightColorIndex = 0;
        this.currentCycleIndex = 0;
        this.settings = {
            columnCount: 2,
            fontSize: 16,
            highlightColors: ['#c3e6cb', '#fff3cd', '#f8d7da', '#e2d9f3']
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

        this.init();
    }

    async init() {
        this.loadSettings();
        this.loadHighlights();
        this.setupEventListeners();
        this.renderPalette();
        this.updateHighlightStyles();
        await this.loadScriptures();
        this.updateBookFilter();
        this.applyFilters();
        this.renderPage();
    }

    // Utility methods
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

    showToast(message) {
        let toast = document.getElementById('sh-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'sh-toast';
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(40,40,40,0.95)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: '6px',
                fontSize: '1.1em',
                zIndex: '9999',
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                opacity: '0',
                pointerEvents: 'none'
            });
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 1200);
    }

    // Settings and data management
    loadSettings() {
        const saved = localStorage.getItem('scriptureSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.applySettings();
    }

    saveSettings() {
        localStorage.setItem('scriptureSettings', JSON.stringify(this.settings));
    }

    applySettings() {
        this.elements.fontSizeDisplay.textContent = `${this.settings.fontSize}px`;
        this.elements.columnCountDisplay.textContent = this.settings.columnCount;
        this.elements.contentArea.style.fontSize = `${this.settings.fontSize}px`;
    }

    getVersesPerPage() {
        // Calculate verses per page based on viewport height and current settings
        const viewportHeight = window.innerHeight;
        const headerHeight = 120; // Approximate height of header/nav
        const footerHeight = 60; // Approximate height of footer/pagination
        const availableHeight = viewportHeight - headerHeight - footerHeight;
        
        // Estimate verse height based on font size
        const fontSize = this.settings.fontSize;
        const lineHeight = fontSize * 1.4; // Approximate line height
        const verseHeight = lineHeight * 2.5; // Average verses take about 2.5 lines
        
        // Calculate base verses that would fit in the height
        const baseVerses = Math.floor(availableHeight / verseHeight);
        
        // CSS multi-column layout doesn't distribute perfectly evenly
        // Be more conservative as column count increases to avoid content below fold
        let adjustmentFactor = 1.0;
        if (this.settings.columnCount === 2) adjustmentFactor = 0.9;
        else if (this.settings.columnCount === 3) adjustmentFactor = 0.75;
        else if (this.settings.columnCount === 4) adjustmentFactor = 0.6;
        else if (this.settings.columnCount === 5) adjustmentFactor = 0.5;
        else if (this.settings.columnCount === 6) adjustmentFactor = 0.4;
        
        const versesPerPage = Math.floor(baseVerses * adjustmentFactor);
        
        // Ensure minimum of 3 verses per page
        return Math.max(versesPerPage, 3);
    }

    loadHighlights() {
        const saved = localStorage.getItem('scriptureHighlights');
        if (saved) {
            this.highlights = JSON.parse(saved);
        }
        const savedPhrases = localStorage.getItem('scripturePhraseHighlights');
        if (savedPhrases) {
            this.phraseHighlights = JSON.parse(savedPhrases);
        }
    }

    saveHighlights() {
        localStorage.setItem('scriptureHighlights', JSON.stringify(this.highlights));
        localStorage.setItem('scripturePhraseHighlights', JSON.stringify(this.phraseHighlights));
    }

    // Scripture loading and parsing
    async loadScriptures() {
        try {
            const response = await fetch('lds-scriptures.txt');
            const text = await response.text();
            this.scriptures = text.split('\n')
                .filter(line => line.trim())
                .map(line => this.parseScriptureLine(line))
                .filter(item => item !== null);
            this.populateFilters();
        } catch (error) {
            console.error('Error loading scriptures:', error);
            this.elements.contentArea.innerHTML = '<div class="loading">Error loading scriptures. Please ensure lds-scriptures.txt is in the same folder.</div>';
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
        const chapter = parseInt(chapterVerse.substring(0, colonIndex));
        const verse = parseInt(chapterVerse.substring(colonIndex + 1));
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

    populateFilters() {
        const volumes = [...new Set(this.scriptures.map(s => s.volume))].sort();
        this.elements.volumeSelect.innerHTML = '<option value="">All Volumes</option>';
        volumes.forEach(vol => {
            const option = document.createElement('option');
            option.value = vol;
            option.textContent = vol;
            this.elements.volumeSelect.appendChild(option);
        });
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
            .filter(s => s.book === this.filters.book && s.chapter === parseInt(this.filters.chapter))
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
            if (this.filters.chapter && scripture.chapter !== parseInt(this.filters.chapter)) return false;
            if (this.filters.verse && scripture.verse !== parseInt(this.filters.verse)) return false;
            return true;
        });
        this.currentPage = 0;
    }

    // Rendering
    renderPage() {
        const versesPerPage = this.getVersesPerPage();
        const startIdx = this.currentPage * versesPerPage;
        const endIdx = startIdx + versesPerPage;
        const versesToShow = this.filteredScriptures.slice(startIdx, endIdx);
        
        const contentArea = this.elements.contentArea;
        
        if (versesToShow.length === 0) {
            contentArea.innerHTML = '<div class="loading">No verses to display</div>';
            return;
        }
        
        const container = document.createElement('div');
        container.className = `scripture-columns cols-${this.settings.columnCount}`;
        
        let html = '';
        let currentBook = '';
        let currentChapter = '';
        
        const groupedVerses = this.groupByChapter(versesToShow);
        
        groupedVerses.forEach((group) => {
            const showBookHeading = group.book !== currentBook;
            const showChapterHeading = group.chapter !== currentChapter || showBookHeading;
            
            if (showBookHeading) {
                html += `<div class="chapter-heading book-heading">${group.book}</div>`;
            }
            currentBook = group.book;
            
            if (showChapterHeading) {
                html += `<div class="chapter-heading">Chapter ${group.chapter}</div>`;
            }
            currentChapter = group.chapter;
            
            group.verses.forEach(verse => {
                const highlightClass = this.getHighlightClass(verse.reference);
                const escapedRef = verse.reference.replace(/"/g, '&quot;');
                const verseContent = this.renderVerseWithPhraseHighlights(verse);
                html += `<span class="verse ${highlightClass}" data-ref="${escapedRef}">`;
                html += `<sup class="verse-ref">${verse.verse}</sup>`;
                html += verseContent;
                html += '</span>';
            });
        });
        
        container.innerHTML = html;
        contentArea.innerHTML = '';
        contentArea.appendChild(container);
        
        // Update page indicator
        const totalPages = Math.ceil(this.filteredScriptures.length / versesPerPage);
        this.elements.pageIndicator.textContent = 
            `Page ${this.currentPage + 1} of ${totalPages}`;
    }

    renderVerseWithPhraseHighlights(verse) {
        const phrases = this.phraseHighlights[verse.reference];
        if (!phrases || phrases.length === 0) {
            return verse.text;
        }
        const sortedPhrases = [...phrases].sort((a, b) => a.start - b.start);
        let result = '';
        let lastIndex = 0;
        sortedPhrases.forEach(phrase => {
            result += verse.text.substring(lastIndex, phrase.start);
            const colorIndex = this.settings.highlightColors.indexOf(phrase.color);
            let highlightClass = colorIndex >= 0 ? `highlight-${colorIndex}` : '';
            let style = `border: 2px solid ${phrase.color}; background: none; color: inherit; padding: 1px 2px; border-radius: 2px; outline: 1px solid red;`;
            if (phrase.color === '#ff00ff') {
                highlightClass += ' placeholder-highlight';
            }
            if (phrase.color && this.isDarkColor(phrase.color)) {
                highlightClass += ' dark-highlight';
            }
            result += `<mark class="phrase-highlight ${highlightClass}" data-phrase-id="${phrase.id}" style="${style}">${verse.text.substring(phrase.start, phrase.end)}</mark>`;
            lastIndex = phrase.end;
        });
        result += verse.text.substring(lastIndex);
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
        } else {
            // For other non-palette colors, no highlight
            return 'highlight-none';
        }
        if (highlight.color && this.isDarkColor(highlight.color)) {
            cls += ' dark-highlight';
        }
        return cls;
    }

    // Palette management
    renderPalette() {
        this.elements.paletteColors.innerHTML = '';
        
        // Add color mode toggle swatch
        const modeSwatch = document.createElement('div');
        modeSwatch.className = 'color-swatch-inline mode-toggle-swatch';
        modeSwatch.textContent = '⟳';
        modeSwatch.style.background = 'linear-gradient(45deg, #ff6666, #ffaa66, #ffff66, #aaff66, #66ff66, #66ffaa, #66ffff, #66aaff, #6666ff, #aa66ff, #ff66ff, #ff66aa)';
        modeSwatch.style.color = '#000';
        modeSwatch.style.fontSize = '18px';
        modeSwatch.style.display = 'flex';
        modeSwatch.style.alignItems = 'center';
        modeSwatch.style.justifyContent = 'center';
        modeSwatch.style.fontWeight = 'bold';
        modeSwatch.title = 'Rainbow Cycle Mode: Click to enable automatic color cycling';
        // Note: rainbow swatch doesn't get 'active' class, only color swatches do
        modeSwatch.addEventListener('click', () => {
            this.highlightApplyMode = 'cycle';
            this.renderPalette();
        });
        this.elements.paletteColors.appendChild(modeSwatch);
        
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
            const activeIndex = this.highlightApplyMode === 'direct' ? this.activeHighlightColorIndex : this.currentCycleIndex;
            if (index === activeIndex) {
                swatch.classList.add('active');
            }
            swatch.addEventListener('click', () => {
                this.activeHighlightColorIndex = index;
                this.highlightApplyMode = 'direct';
                this.renderPalette();
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
        // Navigation
        this.elements.volumeSelect.addEventListener('change', () => {
            this.filters.volume = this.elements.volumeSelect.value;
            this.filters.book = '';
            this.filters.chapter = '';
            this.filters.verse = '';
            this.updateBookFilter();
            this.applyFilters();
            this.renderPage();
        });

        this.elements.bookSelect.addEventListener('change', () => {
            this.filters.book = this.elements.bookSelect.value;
            this.filters.chapter = '';
            this.filters.verse = '';
            this.updateChapterFilter();
            this.applyFilters();
            this.renderPage();
        });

        this.elements.chapterSelect.addEventListener('change', () => {
            this.filters.chapter = this.elements.chapterSelect.value;
            this.filters.verse = '';
            this.updateVerseFilter();
            this.applyFilters();
            this.renderPage();
        });

        this.elements.verseSelect.addEventListener('change', () => {
            this.filters.verse = this.elements.verseSelect.value;
            this.applyFilters();
            this.renderPage();
        });

        // Pagination
        this.elements.prevPageBtn.addEventListener('click', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.renderPage();
                window.scrollTo(0, 0);
            }
        });

        this.elements.nextPageBtn.addEventListener('click', () => {
            const maxPage = Math.ceil(this.filteredScriptures.length / this.getVersesPerPage()) - 1;
            if (this.currentPage < maxPage) {
                this.currentPage++;
                this.renderPage();
                window.scrollTo(0, 0);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const maxPage = Math.ceil(this.filteredScriptures.length / this.getVersesPerPage()) - 1;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.renderPage();
                }
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                if (this.currentPage < maxPage) {
                    this.currentPage++;
                    this.renderPage();
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
                // Handle drag selection
                const verse = e.target.closest('.verse');
                if (verse) {
                    this.expandSelectionToWordBoundaries();
                    this.handlePhraseHighlight(verse);
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
                this.renderPage();
            }
        });

        this.elements.increaseFontBtn.addEventListener('click', () => {
            if (this.settings.fontSize < 48) {
                this.settings.fontSize += 2;
                this.saveSettings();
                this.applySettings();
                this.renderPage();
            }
        });

        this.elements.decreaseColumnsBtn.addEventListener('click', () => {
            if (this.settings.columnCount > 1) {
                this.settings.columnCount--;
                this.saveSettings();
                this.applySettings();
                this.applyFilters();
                this.renderPage();
            }
        });

        this.elements.increaseColumnsBtn.addEventListener('click', () => {
            if (this.settings.columnCount < 6) {
                this.settings.columnCount++;
                this.saveSettings();
                this.applySettings();
                this.applyFilters();
                this.renderPage();
            }
        });

        this.elements.resetColorsBtn.addEventListener('click', () => {
            this.resetColors();
        });

        this.elements.exportBtn.addEventListener('click', () => {
            this.exportHighlights();
        });

        this.elements.importBtn.addEventListener('click', () => {
            this.elements.importModal.classList.remove('hidden');
        });

        this.elements.clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all highlights?')) {
                if (confirm('Export first?')) {
                    this.exportHighlights();
                }
                this.highlights = {};
                this.phraseHighlights = {};
                this.saveHighlights();
                this.renderPage();
            }
        });

        // Import modal
        this.elements.closeImportBtn.addEventListener('click', () => {
            this.elements.importModal.classList.add('hidden');
        });

        this.elements.cancelImportBtn.addEventListener('click', () => {
            this.elements.importModal.classList.add('hidden');
        });

        this.elements.confirmImportBtn.addEventListener('click', () => {
            this.importHighlights();
        });
    }

    // Highlighting logic
    handleVerseClick(reference) {
        const currentHighlight = this.highlights[reference];
        if (this.highlightApplyMode === 'direct') {
            this.highlights[reference] = {
                color: this.settings.highlightColors[this.activeHighlightColorIndex],
                timestamp: Date.now()
            };
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
            } else {
                this.phraseHighlights[ref].push({
                    id: Date.now(),
                    start: actualStart,
                    end: actualEnd,
                    text: selectedText,
                    color: this.settings.highlightColors[this.activeHighlightColorIndex],
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
                }
            } else {
                this.phraseHighlights[ref].push({
                    id: Date.now(),
                    start: actualStart,
                    end: actualEnd,
                    text: selectedText,
                    color: this.settings.highlightColors[this.activeHighlightColorIndex],
                    timestamp: Date.now()
                });
            }
        }
        selection.removeAllRanges();
        this.saveHighlights();
        this.renderPage();
    }

    cyclePhraseHighlight(phraseElement) {
        const verseElement = phraseElement.closest('.verse');
        const ref = verseElement.dataset.ref;
        const phraseId = parseInt(phraseElement.dataset.phraseId);
        const phraseIndex = this.phraseHighlights[ref]?.findIndex(p => p.id === phraseId);
        if (phraseIndex === -1 || phraseIndex === undefined) return;
        const phrase = this.phraseHighlights[ref][phraseIndex];
        const currentIndex = this.settings.highlightColors.indexOf(phrase.color);
        if (currentIndex < this.settings.highlightColors.length - 1) {
            this.phraseHighlights[ref][phraseIndex].color = this.settings.highlightColors[currentIndex + 1];
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
        const defaultColors = ['#c3e6cb', '#fff3cd', '#f8d7da', '#e2d9f3'];
        const usedColors = this.getUsedHighlightColors();
        const removedColors = usedColors.filter(c => !defaultColors.includes(c));
        if (removedColors.length > 0) {
            const usage = this.getHighlightUsageByColor();
            let msg = 'Some colors you have used are not in the default palette.\n';
            msg += 'If you continue, highlights using these colors will be replaced with a placeholder color.\n\n';
            removedColors.forEach(c => {
                msg += `${c}: ${usage[c].verses} verse(s), ${usage[c].phrases} phrase(s)\n`;
            });
            msg += '\nContinue and replace these highlights?';
            if (!confirm(msg)) return;
        }
        const placeholder = '#ff00ff';
        Object.entries(this.highlights).forEach(([ref, h]) => {
            if (!defaultColors.includes(h.color)) {
                this.highlights[ref].color = placeholder;
            }
        });
        Object.entries(this.phraseHighlights).forEach(([ref, arr]) => {
            arr.forEach(p => {
                if (!defaultColors.includes(p.color)) {
                    p.color = placeholder;
                }
            });
        });
        this.settings.highlightColors = defaultColors;
        this.activeHighlightColorIndex = 0;
        this.saveHighlights();
        this.saveSettings();
        this.updateHighlightStyles();
        this.renderPalette();
        this.renderPage();
    }

    // Import/Export
    exportHighlights() {
        const data = {
            highlights: this.highlights,
            phraseHighlights: this.phraseHighlights,
            colors: this.settings.highlightColors,
            exportDate: new Date().toISOString(),
            version: '1.1'
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

    importHighlights() {
        const textarea = this.elements.importTextarea;
        try {
            const data = JSON.parse(textarea.value);
            if (data.highlights) {
                if (confirm('This will replace your current highlights. Continue?')) {
                    this.highlights = data.highlights;
                    this.phraseHighlights = data.phraseHighlights || {};
                    if (data.colors) {
                        this.settings.highlightColors = data.colors;
                    }
                    this.saveHighlights();
                    this.saveSettings();
                    this.updateHighlightStyles();
                    this.renderPalette();
                    this.renderPage();
                    this.elements.importModal.classList.add('hidden');
                    textarea.value = '';
                }
            } else {
                alert('Invalid highlight file format');
            }
        } catch (error) {
            alert('Error parsing JSON: ' + error.message);
        }
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ScriptureApp());
} else {
    new ScriptureApp();
}