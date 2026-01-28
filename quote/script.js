// Document sources configuration
// Maps txt files to display names and categories
const SOURCES = {
    'kjv.txt': { name: 'Bible (KJV)', category: 'scripture', hasVerses: true },
    'bom.txt': { name: 'Book of Mormon', category: 'scripture', hasVerses: true },
    'dnc.txt': { name: 'Doctrine and Covenants', category: 'scripture', hasVerses: true },
    'pogp.txt': { name: 'Pearl of Great Price', category: 'scripture', hasVerses: true },
    'uscon.txt': { name: 'U.S. Constitution', category: 'founding', hasVerses: false },
    'usbor.txt': { name: 'Bill of Rights', category: 'founding', hasVerses: false },
    'usdoi.txt': { name: 'Declaration of Independence', category: 'founding', hasVerses: false },
    't8.shakespeare.txt': { name: 'Shakespeare', category: 'literature', hasVerses: false },
};

// State
let allVerses = [];
let favoriteVerses = [];
let categories = new Set(['all', 'favorites']);
let activeCategory = 'all';
let currentQuote = null;
let isVOTD = true;

// DOM elements
const quoteText = document.getElementById('quoteText');
const sourceRef = document.getElementById('sourceRef');
const sourceCat = document.getElementById('sourceCat');
const quoteCard = document.getElementById('quoteCard');
const votdBadge = document.getElementById('votdBadge');
const toast = document.getElementById('toast');
const filterButtons = document.getElementById('filterButtons');
const loadingStatus = document.getElementById('loadingStatus');
const searchLink = document.getElementById('searchLink');

// Load and parse all documents
async function loadDocuments() {
    let totalVerses = 0;

    for (const [filename, config] of Object.entries(SOURCES)) {
        try {
            const response = await fetch(`/textfiles/txt/${filename}`);
            if (!response.ok) continue;

            const text = await response.text();
            const verses = parseDocument(text, config, filename);
            allVerses.push(...verses);
            totalVerses += verses.length;

            // Track categories
            categories.add(config.category);

        } catch (error) {
            console.warn(`Could not load ${filename}:`, error);
        }
    }

    // Add standalone quotes from favorites.js
    if (typeof STANDALONE_QUOTES !== 'undefined') {
        STANDALONE_QUOTES.forEach(q => {
            allVerses.push({
                text: q.text,
                reference: q.ref,
                source: q.source,
                category: q.category || 'other',
                isStandalone: true
            });
            categories.add(q.category || 'other');
        });
    }

    // Build favorite verses list by matching references
    if (typeof FAVORITES !== 'undefined') {
        favoriteVerses = allVerses.filter(v => {
            return FAVORITES.some(f => v.reference.includes(f.ref));
        });
        // Also add standalone favorites
        favoriteVerses.push(...allVerses.filter(v => v.isStandalone));
    }

    // Update UI
    loadingStatus.textContent = `${totalVerses.toLocaleString()} verses loaded from ${Object.keys(SOURCES).length} sources`;
    buildFilterButtons();

    // Show initial quote
    displayQuote(getQuoteOfTheDay(), true);
}

// Parse document based on format
function parseDocument(text, config, filename) {
    const verses = [];
    const lines = text.split('\n').filter(line => line.trim());

    if (config.hasVerses) {
        // Scripture format: "Reference\tText"
        for (const line of lines) {
            const tabIndex = line.indexOf('\t');
            if (tabIndex > 0) {
                const reference = line.substring(0, tabIndex).trim();
                const verseText = line.substring(tabIndex + 1).trim();

                // Skip very short verses or chapter headings
                if (verseText.length > 20 && verseText.length < 1000) {
                    verses.push({
                        text: verseText,
                        reference: reference,
                        source: config.name,
                        category: config.category,
                        filename: filename
                    });
                }
            }
        }
    } else {
        // Prose format: paragraphs
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i].trim().replace(/\n/g, ' ');

            // Skip very short or very long paragraphs, skip headers
            if (para.length > 50 && para.length < 800 && !para.match(/^(Article|Section|Amendment)/i)) {
                verses.push({
                    text: para,
                    reference: config.name,
                    source: config.name,
                    category: config.category,
                    filename: filename
                });
            }
        }
    }

    return verses;
}

// Build filter buttons dynamically
function buildFilterButtons() {
    const categoryNames = {
        'all': 'All',
        'favorites': '★ Favorites',
        'scripture': 'Scripture',
        'founding': 'Founding Docs',
        'literature': 'Literature',
        'philosophy': 'Philosophy',
        'other': 'Other'
    };

    filterButtons.innerHTML = '';

    for (const cat of ['all', 'favorites', 'scripture', 'founding', 'literature', 'philosophy']) {
        if (categories.has(cat) || cat === 'all' || cat === 'favorites') {
            const btn = document.createElement('button');
            btn.className = 'filter-btn' + (cat === activeCategory ? ' active' : '');
            btn.dataset.category = cat;
            btn.textContent = categoryNames[cat] || cat;
            btn.addEventListener('click', () => setCategory(cat));
            filterButtons.appendChild(btn);
        }
    }
}

// Set active category
function setCategory(cat) {
    activeCategory = cat;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === cat);
    });

    // Show appropriate quote
    if (isVOTD) {
        displayQuote(getQuoteOfTheDay(), true);
    } else {
        displayQuote(getRandomQuote(), false);
    }
}

// Get filtered verses
function getFilteredVerses() {
    if (activeCategory === 'all') return allVerses;
    if (activeCategory === 'favorites') return favoriteVerses;
    return allVerses.filter(v => v.category === activeCategory);
}

// Seeded random for consistent daily quote
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Get today's date as seed
function getTodaySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

// Get quote of the day
function getQuoteOfTheDay() {
    const filtered = getFilteredVerses();
    if (filtered.length === 0) return null;

    const seed = getTodaySeed() + activeCategory.charCodeAt(0);
    const index = Math.floor(seededRandom(seed) * filtered.length);
    return filtered[index];
}

// Get random quote
function getRandomQuote() {
    const filtered = getFilteredVerses();
    if (filtered.length === 0) return null;

    const index = Math.floor(Math.random() * filtered.length);
    return filtered[index];
}

// Display quote with animation
function displayQuote(quote, showVOTD = false) {
    if (!quote) {
        quoteText.textContent = 'No verses found for this category.';
        sourceRef.textContent = '';
        sourceCat.textContent = '';
        return;
    }

    currentQuote = quote;
    isVOTD = showVOTD;

    // Animate out
    quoteCard.style.opacity = '0';
    quoteCard.style.transform = 'translateY(10px)';

    setTimeout(() => {
        quoteText.textContent = quote.text;
        sourceRef.textContent = `— ${quote.reference}`;
        sourceCat.textContent = quote.source;

        votdBadge.classList.toggle('hidden', !showVOTD);

        // Update search link
        const searchTerm = encodeURIComponent(quote.reference.split(' ')[0]);
        searchLink.href = `/textfiles/?q=${searchTerm}`;

        // Animate in
        quoteCard.style.opacity = '1';
        quoteCard.style.transform = 'translateY(0)';
    }, 200);
}

// Copy to clipboard
function copyQuote() {
    if (!currentQuote) return;

    const text = `"${currentQuote.text}"\n\n— ${currentQuote.reference} (${currentQuote.source})`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copied to clipboard!');
    });
}

// Show toast notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Event listeners
document.getElementById('newQuoteBtn').addEventListener('click', () => {
    displayQuote(getRandomQuote(), false);
});

document.getElementById('todayBtn').addEventListener('click', () => {
    displayQuote(getQuoteOfTheDay(), true);
});

document.getElementById('copyBtn').addEventListener('click', copyQuote);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        displayQuote(getRandomQuote(), false);
    } else if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        copyQuote();
    } else if (e.key === 't') {
        displayQuote(getQuoteOfTheDay(), true);
    }
});

// Initialize
loadDocuments();
