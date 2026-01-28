// Global variables
let documents = [];
let enabled = {};

// Load documents from txt/ directory
async function loadDocuments() {
    const fileMappings = {
        'kjv.txt': 'KJV Bible',
        'bom.txt': 'Book of Mormon',
        'pogp.txt': 'Pearl of Great Price',
        'dnc.txt': 'Doctrine and Covenants',
        'usdoi.txt': 'Declaration of Independence',
        'usbor.txt': 'Bill of Rights',
        'uscon.txt': 'U.S. Constitution',
        't8.shakespeare.txt': 'Shakespeare'
    };
    const files = Object.keys(fileMappings);
    for (const file of files) {
        try {
            const response = await fetch(`txt/${file}`);
            const text = await response.text();
            documents.push({
                title: fileMappings[file],
                content: text
            });
            enabled[fileMappings[file]] = true; // Default enabled
        } catch (error) {
            console.error(`Error loading ${file}:`, error);
        }
    }
    createToggles();
    renderResults();
}

// Create toggle buttons for each document
function createToggles() {
    const togglesDiv = document.getElementById('document-toggles');
    togglesDiv.innerHTML = '';
    documents.forEach(doc => {
        const btn = document.createElement('button');
        btn.className = 'toggle-btn';
        if (enabled[doc.title]) btn.classList.add('active');
        btn.textContent = doc.title.replace('.txt', '');
        btn.addEventListener('click', () => toggleDocument(doc.title));
        togglesDiv.appendChild(btn);
    });
}

// Toggle a document's enabled state and re-render
function toggleDocument(title) {
    enabled[title] = !enabled[title];
    createToggles(); // Update button states
    renderResults(searchBar.value); // Re-render with current search
}

const searchBar = document.getElementById('search-bar');
const resultsDiv = document.getElementById('results');

// Highlight matching text in a string
function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Render search results or document previews
function renderResults(query = '') {
    resultsDiv.innerHTML = '';
    const enabledDocs = documents.filter(doc => enabled[doc.title]);
    enabledDocs.forEach(doc => {
        const docDiv = document.createElement('div');
        docDiv.className = 'document';

        let contentHtml = '';
        if (query) {
            const lines = doc.content.split('\n');
            const matchingLines = lines.filter(line => line.toLowerCase().includes(query.toLowerCase()));
            if (matchingLines.length > 0) {
                contentHtml = matchingLines.slice(0, 50).map(line => `<p>${highlightText(line, query)}</p>`).join(''); // Limit to 50 lines
            } else {
                return; // Skip if no matches
            }
        } else {
            // If no query, show first few lines or summary
            const lines = doc.content.split('\n').slice(0, 10);
            contentHtml = lines.map(line => `<p>${line}</p>`).join('');
        }

        docDiv.innerHTML = `
            <h3>${highlightText(doc.title, query)}</h3>
            ${contentHtml}
        `;

        resultsDiv.appendChild(docDiv);
    });
}

// Debounce function to limit how often renderResults is called
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Event listener with debounce for search input
searchBar.addEventListener('input', debounce((e) => {
    renderResults(e.target.value);
}, 300));

// Initial load
loadDocuments();