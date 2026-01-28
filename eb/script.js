const scriptures = {};
let highlights;
try {
    highlights = JSON.parse(localStorage.getItem('highlights')) || {};
} catch (e) {
    console.error('Failed to parse highlights:', e);
    highlights = {};
}
const palette = ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887', '#F4A460', '#D2B48C'];
let currentBook = localStorage.getItem('currentBook') || 'bom';
let currentChapter = parseInt(localStorage.getItem('currentChapter')) || 1;
let searchQuery = localStorage.getItem('searchQuery') || '';
let searchAll = localStorage.getItem('searchAll') === 'true';
let selectedColor = palette[0];
let highlightMode = 'verse'; // verse, phrase, box

document.addEventListener('DOMContentLoaded', () => {
    loadScriptures();
    setupUI();
    loadState();
    displayContent();
});

async function loadScriptures() {
    const books = ['bom', 'dnc', 'kjv', 'pogp'];
    for (const book of books) {
        const response = await fetch(`${book}.txt`);
        const text = await response.text();
        scriptures[book] = parseBook(text);
    }
}

function parseBook(text) {
    const lines = text.split('\n');
    const book = {};
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        if (parts.length < 2) continue;
        const ref = parts[0];
        const text = parts[1];
        // Parse ref: "1 Nephi 1:1" -> bookName: "1 Nephi", chapter:1, verse:1
        const match = ref.match(/^(.+?) (\d+):(\d+)$/);
        if (!match) continue;
        const bookName = match[1];
        const chapter = parseInt(match[2]);
        const verse = parseInt(match[3]);
        if (!book[chapter]) book[chapter] = {};
        book[chapter][verse] = { text, ref };
    }
    return book;
}

function setupUI() {
    document.getElementById('bookSelect').value = currentBook;
    document.getElementById('bookSelect').addEventListener('change', (e) => {
        currentBook = e.target.value;
        currentChapter = 1;
        saveState();
        displayContent();
    });

    document.getElementById('prevChapter').addEventListener('click', () => {
        if (currentChapter > 1) {
            currentChapter--;
            saveState();
            displayContent();
        }
    });

    document.getElementById('nextChapter').addEventListener('click', () => {
        const maxChapter = Object.keys(scriptures[currentBook] || {}).length;
        if (currentChapter < maxChapter) {
            currentChapter++;
            saveState();
            displayContent();
        }
    });

    document.getElementById('searchInput').value = searchQuery;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        saveState();
        displayContent();
    });

    document.getElementById('searchAll').checked = searchAll;
    document.getElementById('searchAll').addEventListener('change', (e) => {
        searchAll = e.target.checked;
        saveState();
        displayContent();
    });

    document.getElementById('fontSize').addEventListener('input', (e) => {
        document.getElementById('content').style.fontSize = e.target.value + 'px';
    });

    document.getElementById('columns').addEventListener('change', (e) => {
        document.getElementById('content').style.columnCount = e.target.value;
    });

    document.getElementById('lineSpacing').addEventListener('input', (e) => {
        document.getElementById('content').style.lineHeight = e.target.value;
    });

    document.getElementById('theme').addEventListener('change', (e) => {
        document.body.className = e.target.value;
    });

    document.getElementById('fontFamily').addEventListener('change', (e) => {
        document.body.style.fontFamily = e.target.value;
    });

    setupPalette();
    setupHighlightMode();
    setupImportExport();
}

function setupPalette() {
    const paletteDiv = document.getElementById('palette');
    palette.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.backgroundColor = color;
        btn.addEventListener('click', () => selectedColor = color);
        paletteDiv.appendChild(btn);
    });
    addPlusButton();
}

function addPlusButton() {
    const paletteDiv = document.getElementById('palette');
    const plusBtn = document.createElement('button');
    plusBtn.textContent = '+';
    plusBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.addEventListener('change', (e) => {
            palette.push(e.target.value);
            const btn = document.createElement('button');
            btn.className = 'color-btn';
            btn.style.backgroundColor = e.target.value;
            btn.addEventListener('click', () => selectedColor = e.target.value);
            paletteDiv.insertBefore(btn, plusBtn);
            input.remove();
            addPlusButton(); // add new +
        });
        paletteDiv.appendChild(input);
        plusBtn.remove();
    });
    paletteDiv.appendChild(plusBtn);
}

function setupHighlightMode() {
    ['verseMode', 'phraseMode', 'boxMode'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => {
            highlightMode = id.replace('Mode', '');
            document.querySelectorAll('#highlightMode button').forEach(btn => btn.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        });
    });
}

function setupImportExport() {
    document.getElementById('exportHighlights').addEventListener('click', () => {
        const data = JSON.stringify(highlights, null, 2);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'highlights.json';
        a.click();
    });

    document.getElementById('importHighlights').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    Object.assign(highlights, imported);
                    localStorage.setItem('highlights', JSON.stringify(highlights));
                    displayContent();
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        }
    });
}

function loadState() {
    document.getElementById('fontSize').value = localStorage.getItem('fontSize') || 16;
    document.getElementById('columns').value = localStorage.getItem('columns') || 1;
    document.getElementById('lineSpacing').value = localStorage.getItem('lineSpacing') || 1.5;
    document.getElementById('theme').value = localStorage.getItem('theme') || 'light';
    document.body.className = document.getElementById('theme').value;
    document.getElementById('fontFamily').value = localStorage.getItem('fontFamily') || 'serif';
    document.body.style.fontFamily = document.getElementById('fontFamily').value;
    document.getElementById('content').style.fontSize = document.getElementById('fontSize').value + 'px';
    document.getElementById('content').style.columnCount = document.getElementById('columns').value;
    document.getElementById('content').style.lineHeight = document.getElementById('lineSpacing').value;
}

function saveState() {
    localStorage.setItem('currentBook', currentBook);
    localStorage.setItem('currentChapter', currentChapter);
    localStorage.setItem('searchQuery', searchQuery);
    localStorage.setItem('searchAll', searchAll);
    localStorage.setItem('fontSize', document.getElementById('fontSize').value);
    localStorage.setItem('columns', document.getElementById('columns').value);
    localStorage.setItem('lineSpacing', document.getElementById('lineSpacing').value);
    localStorage.setItem('theme', document.getElementById('theme').value);
    localStorage.setItem('fontFamily', document.getElementById('fontFamily').value);
    localStorage.setItem('highlights', JSON.stringify(highlights));
}

function displayContent() {
    const content = document.getElementById('content');
    content.innerHTML = '';

    if (searchQuery) {
        displaySearchResults();
    } else {
        displayChapter();
    }
}

function displayChapter() {
    const chapter = scriptures[currentBook][currentChapter];
    if (!chapter) return;

    const chapterDiv = document.createElement('div');
    chapterDiv.className = 'chapter';
    for (const [verseNum, verse] of Object.entries(chapter)) {
        const verseDiv = document.createElement('div');
        verseDiv.className = 'verse';
        verseDiv.dataset.book = currentBook;
        verseDiv.dataset.chapter = currentChapter;
        verseDiv.dataset.verse = verseNum;
        verseDiv.innerHTML = `<sup>${verseNum}</sup> ${verse.text}`;
        applyHighlights(verseDiv, currentBook, currentChapter, verseNum);
        chapterDiv.appendChild(verseDiv);
    }
    document.getElementById('content').appendChild(chapterDiv);
    setupVerseEvents();
}

function displaySearchResults() {
    const results = [];
    const booksToSearch = searchAll ? Object.keys(scriptures) : [currentBook];
    for (const book of booksToSearch) {
        for (const chapter in scriptures[book]) {
            for (const verse in scriptures[book][chapter]) {
                const text = scriptures[book][chapter][verse].text;
                if (text.toLowerCase().includes(searchQuery.toLowerCase())) {
                    results.push({book, chapter: parseInt(chapter), verse: parseInt(verse), text});
                }
            }
        }
    }
    results.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'verse';
        resultDiv.dataset.book = result.book;
        resultDiv.dataset.chapter = result.chapter;
        resultDiv.dataset.verse = result.verse;
        resultDiv.innerHTML = `<strong>${result.book} ${result.chapter}:${result.verse}</strong> ${result.text}`;
        applyHighlights(resultDiv, result.book, result.chapter, result.verse);
        document.getElementById('content').appendChild(resultDiv);
    });
    setupVerseEvents();
}

function applyHighlights(verseDiv, book, chapter, verse) {
    const verseHighlights = highlights[book]?.[chapter]?.[verse] || [];
    verseHighlights.forEach(hl => {
        if (hl.type === 'verse') {
            verseDiv.classList.add('highlight');
            verseDiv.style.backgroundColor = hl.color;
        } else {
            // For phrase/box, need to highlight specific text
            // Simplified: assume whole verse for now
            if (hl.type === 'box') {
                verseDiv.classList.add('box-highlight');
                verseDiv.style.borderColor = hl.color;
            } else {
                verseDiv.classList.add('highlight');
                verseDiv.style.backgroundColor = hl.color;
            }
        }
    });
}

function setupVerseEvents() {
    document.querySelectorAll('.verse').forEach(verseDiv => {
        verseDiv.addEventListener('dblclick', () => {
            const book = verseDiv.dataset.book;
            const chapter = verseDiv.dataset.chapter;
            const verse = verseDiv.dataset.verse;
            addHighlight(book, chapter, verse, 'verse', scriptures[book][chapter][verse].text);
            applyHighlights(verseDiv, book, chapter, verse);
        });

        // For drag selection
        let startX, startY;
        verseDiv.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
        });
        verseDiv.addEventListener('mouseup', (e) => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const selectedText = selection.toString().trim();
                if (selectedText) {
                    const book = verseDiv.dataset.book;
                    const chapter = verseDiv.dataset.chapter;
                    const verse = verseDiv.dataset.verse;
                    // Expand to whole words
                    const expanded = expandToWords(selectedText, scriptures[book][chapter][verse].text);
                    addHighlight(book, chapter, verse, highlightMode, expanded);
                    applyHighlights(verseDiv, book, chapter, verse);
                }
            }
        });
    });
}

function expandToWords(selected, fullText) {
    // Simple expansion: find start and end words
    const words = fullText.split(/\s+/);
    const selectedWords = selected.split(/\s+/);
    const startWord = selectedWords[0];
    const endWord = selectedWords[selectedWords.length - 1];
    const startIndex = words.indexOf(startWord);
    const endIndex = words.lastIndexOf(endWord);
    if (startIndex !== -1 && endIndex !== -1) {
        return words.slice(startIndex, endIndex + 1).join(' ');
    }
    return selected;
}

function addHighlight(book, chapter, verse, type, text) {
    if (!highlights[book]) highlights[book] = {};
    if (!highlights[book][chapter]) highlights[book][chapter] = {};
    if (!highlights[book][chapter][verse]) highlights[book][chapter][verse] = [];
    highlights[book][chapter][verse].push({
        type,
        color: selectedColor,
        text,
        timestamp: Date.now(),
        notes: ''
    });
    saveState();
}