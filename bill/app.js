/**
 * The Bard's Library - Shakespeare Explorer
 */

let DATA = null;
let filteredChunks = [];
let currentPage = 0;
const ITEMS_PER_PAGE = 20;
let quoteHistory = [];
let savedNames = [];

// Theme handling
let currentTheme = localStorage.getItem('bard-theme') || 'default';

function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('bard-theme', theme);
  const btn = document.getElementById('themeToggle');
  btn.textContent = theme === 'dark' ? '☀️' : theme === 'parchment' ? '📜' : '🌙';
}

function cycleTheme() {
  const themes = ['default', 'dark', 'parchment'];
  const next = (themes.indexOf(currentTheme) + 1) % themes.length;
  setTheme(themes[next]);
}

// Initialize
async function init() {
  try {
    const response = await fetch('shakespeare-data.json');
    DATA = await response.json();

    loadSavedData();
    initSearch();
    initBrowse();
    initQuote();
    initInsult();
    initNames();
    initStats();
    initTabs();
    initKeyboard();

    setTheme(currentTheme);
    document.getElementById('loading').classList.add('hidden');

  } catch (err) {
    console.error('Failed to load:', err);
    document.getElementById('loading').innerHTML = `
      <p style="color: #c00;">Failed to load Shakespeare data.</p>
      <p>Run: <code>node preprocess.js</code></p>
    `;
  }
}

function loadSavedData() {
  try {
    const saved = localStorage.getItem('bard-saved-names');
    if (saved) savedNames = JSON.parse(saved);
  } catch (e) {}
}

function saveSavedNames() {
  localStorage.setItem('bard-saved-names', JSON.stringify(savedNames));
}

// Tabs
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });
}

function switchView(viewName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
  document.getElementById(`${viewName}-view`)?.classList.add('active');
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Highlight search terms
function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<span class="highlight">$1</span>');
}

// ==================== SEARCH ====================

function initSearch() {
  const input = document.getElementById('searchInput');
  const workFilter = document.getElementById('workFilter');
  const typeFilter = document.getElementById('typeFilter');
  const sortOrder = document.getElementById('sortOrder');

  // Populate work filter
  DATA.works.forEach(work => {
    const opt = document.createElement('option');
    opt.value = work.id;
    opt.textContent = work.title;
    workFilter.appendChild(opt);
  });

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(performSearch, 150);
  });

  workFilter.addEventListener('change', performSearch);
  typeFilter.addEventListener('change', performSearch);
  sortOrder.addEventListener('change', performSearch);

  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      renderSearchResults();
    }
  });

  document.getElementById('nextPage').addEventListener('click', () => {
    const maxPage = Math.ceil(filteredChunks.length / ITEMS_PER_PAGE) - 1;
    if (currentPage < maxPage) {
      currentPage++;
      renderSearchResults();
    }
  });

  // Show initial state
  document.getElementById('searchResults').innerHTML = `
    <div style="text-align:center; padding:40px; color:var(--text-dim);">
      <p style="font-size:2rem; margin-bottom:12px;">🔍</p>
      <p>Search across ${DATA.stats.words.toLocaleString()} words of Shakespeare</p>
    </div>
  `;
}

function performSearch() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const workFilter = document.getElementById('workFilter').value;
  const typeFilter = document.getElementById('typeFilter').value;
  const sortOrder = document.getElementById('sortOrder').value;

  if (!query) {
    document.getElementById('resultCount').textContent = '';
    document.getElementById('searchResults').innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-dim);">
        <p style="font-size:2rem; margin-bottom:12px;">🔍</p>
        <p>Start typing to search...</p>
      </div>
    `;
    document.getElementById('pagination').style.display = 'none';
    return;
  }

  // Filter chunks
  filteredChunks = DATA.chunks.filter(chunk => {
    if (!chunk.searchText.includes(query)) return false;

    if (workFilter) {
      const work = DATA.works[chunk.workIndex];
      if (work.id !== parseInt(workFilter)) return false;
    }

    if (typeFilter) {
      const work = DATA.works[chunk.workIndex];
      if (work.type !== typeFilter) return false;
    }

    return true;
  });

  // Score and sort
  filteredChunks.forEach(chunk => {
    let score = 0;
    const matches = (chunk.searchText.match(new RegExp(query, 'g')) || []).length;
    score += matches * 10;
    chunk._score = score;
  });

  if (sortOrder === 'relevance') {
    filteredChunks.sort((a, b) => b._score - a._score);
  } else {
    filteredChunks.sort((a, b) => a.workIndex - b.workIndex);
  }

  currentPage = 0;
  renderSearchResults(query);
}

function renderSearchResults(query) {
  const results = document.getElementById('searchResults');
  const pagination = document.getElementById('pagination');
  const q = query || document.getElementById('searchInput').value.trim();

  document.getElementById('resultCount').textContent = `${filteredChunks.length.toLocaleString()} results`;

  if (filteredChunks.length === 0) {
    results.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-dim);">
        <p style="font-size:2rem; margin-bottom:12px;">📖</p>
        <p>No results found for "${escapeHtml(q)}"</p>
      </div>
    `;
    pagination.style.display = 'none';
    return;
  }

  const start = currentPage * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageChunks = filteredChunks.slice(start, end);

  results.innerHTML = pageChunks.map(chunk => {
    const work = DATA.works[chunk.workIndex];
    const location = chunk.act ? `Act ${chunk.act}${chunk.scene ? `, Scene ${chunk.scene}` : ''}` : '';

    return `
      <div class="result-item">
        <div class="result-meta">
          <span class="result-work">${escapeHtml(work.title)}</span>
          ${location ? `<span class="result-location">${location}</span>` : ''}
        </div>
        <div class="result-text">${highlight(chunk.text, q)}</div>
      </div>
    `;
  }).join('');

  const totalPages = Math.ceil(filteredChunks.length / ITEMS_PER_PAGE);
  if (totalPages > 1) {
    pagination.style.display = 'flex';
    document.getElementById('pageInfo').textContent = `Page ${currentPage + 1} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 0;
    document.getElementById('nextPage').disabled = currentPage >= totalPages - 1;
  } else {
    pagination.style.display = 'none';
  }
}

// ==================== BROWSE ====================

function initBrowse() {
  const select = document.getElementById('browseWork');
  const grid = document.getElementById('workGrid');

  DATA.works.forEach(work => {
    const opt = document.createElement('option');
    opt.value = work.id;
    opt.textContent = `${work.title} (${work.type})`;
    select.appendChild(opt);

    // Grid card
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div>${escapeHtml(work.title)}</div>
      <div class="type-badge">${work.type}</div>
    `;
    card.addEventListener('click', () => {
      select.value = work.id;
      showWorkContent(work.id);
    });
    grid.appendChild(card);
  });

  select.addEventListener('change', () => {
    if (select.value) {
      showWorkContent(parseInt(select.value));
    }
  });
}

function showWorkContent(workId) {
  const content = document.getElementById('browseContent');
  const work = DATA.works[workId];
  const chunks = DATA.chunks.filter(c => c.workIndex === workId);

  let html = `<h2 style="margin-bottom:20px; font-family:var(--font-display);">${escapeHtml(work.fullTitle)}</h2>`;

  // Group by act/scene
  let currentAct = null;
  let currentScene = null;

  chunks.forEach(chunk => {
    if (chunk.act && chunk.act !== currentAct) {
      currentAct = chunk.act;
      html += `<h3 style="margin-top:24px; margin-bottom:12px; color:var(--accent);">Act ${currentAct}</h3>`;
      currentScene = null;
    }

    if (chunk.scene && chunk.scene !== currentScene) {
      currentScene = chunk.scene;
      html += `<h4 style="margin-top:16px; margin-bottom:8px; color:var(--text-dim);">Scene ${currentScene}</h4>`;
    }

    html += `<p style="margin-bottom:12px; font-family:var(--font-display); white-space:pre-wrap; line-height:1.7;">${escapeHtml(chunk.text)}</p>`;
  });

  content.innerHTML = html;
}

// ==================== RANDOM QUOTE ====================

function initQuote() {
  document.getElementById('newQuoteBtn').addEventListener('click', showRandomQuote);
  document.getElementById('copyQuoteBtn').addEventListener('click', copyQuote);
  showRandomQuote();
}

function showRandomQuote() {
  const quote = DATA.quotes[Math.floor(Math.random() * DATA.quotes.length)];

  document.getElementById('quoteText').textContent = quote.text;
  document.getElementById('quoteCite').textContent = `— ${quote.work}, Act ${quote.act}, Scene ${quote.scene}`;

  // Add to history
  quoteHistory.unshift(quote);
  if (quoteHistory.length > 5) quoteHistory.pop();
  renderQuoteHistory();
}

function renderQuoteHistory() {
  const container = document.getElementById('quoteHistory');
  container.innerHTML = quoteHistory.slice(1).map(q => `
    <div class="history-item" onclick="showSpecificQuote(${DATA.quotes.indexOf(q)})">
      "${escapeHtml(q.text.slice(0, 50))}..."
    </div>
  `).join('');
}

window.showSpecificQuote = function(index) {
  const quote = DATA.quotes[index];
  document.getElementById('quoteText').textContent = quote.text;
  document.getElementById('quoteCite').textContent = `— ${quote.work}, Act ${quote.act}, Scene ${quote.scene}`;
};

function copyQuote() {
  const text = document.getElementById('quoteText').textContent;
  const cite = document.getElementById('quoteCite').textContent;
  navigator.clipboard.writeText(`"${text}"\n${cite}`);
  showToast('Quote copied!');
}

// ==================== INSULT GENERATOR ====================

function initInsult() {
  document.getElementById('newInsultBtn').addEventListener('click', generateInsult);
  document.getElementById('copyInsultBtn').addEventListener('click', copyInsult);

  // Populate word columns
  renderInsultColumn('col1Words', DATA.insults.col1, 1);
  renderInsultColumn('col2Words', DATA.insults.col2, 2);
  renderInsultColumn('col3Words', DATA.insults.col3, 3);

  generateInsult();
}

function renderInsultColumn(containerId, words, colNum) {
  const container = document.getElementById(containerId);
  container.innerHTML = words.slice(0, 15).map(word => `
    <span onclick="selectInsultWord(${colNum}, '${word}')">${word}</span>
  `).join('');
}

window.selectInsultWord = function(col, word) {
  document.getElementById(`insult${col}`).textContent = word;
  // Update selected state
  document.querySelectorAll(`#col${col}Words span`).forEach(s => s.classList.remove('selected'));
  event.target.classList.add('selected');
};

function generateInsult() {
  const w1 = DATA.insults.col1[Math.floor(Math.random() * DATA.insults.col1.length)];
  const w2 = DATA.insults.col2[Math.floor(Math.random() * DATA.insults.col2.length)];
  const w3 = DATA.insults.col3[Math.floor(Math.random() * DATA.insults.col3.length)];

  document.getElementById('insult1').textContent = w1;
  document.getElementById('insult2').textContent = w2;
  document.getElementById('insult3').textContent = w3;
}

function copyInsult() {
  const w1 = document.getElementById('insult1').textContent;
  const w2 = document.getElementById('insult2').textContent;
  const w3 = document.getElementById('insult3').textContent;
  navigator.clipboard.writeText(`Thou ${w1} ${w2} ${w3}!`);
  showToast('Insult copied!');
}

// ==================== NAME GENERATOR ====================

function initNames() {
  document.getElementById('newNameBtn').addEventListener('click', generateName);
  document.getElementById('copyNameBtn').addEventListener('click', copyName);
  renderSavedNames();
}

function generateName() {
  const includeTitle = document.getElementById('includeTitle').checked;
  const includePlace = document.getElementById('includePlace').checked;

  let name = '';

  if (includeTitle && Math.random() > 0.3) {
    name += DATA.names.prefixes[Math.floor(Math.random() * DATA.names.prefixes.length)] + ' ';
  }

  name += DATA.names.first[Math.floor(Math.random() * DATA.names.first.length)];

  if (includePlace && Math.random() > 0.4) {
    name += ' ' + DATA.names.places[Math.floor(Math.random() * DATA.names.places.length)];
  }

  document.getElementById('generatedName').textContent = name;
}

function copyName() {
  const name = document.getElementById('generatedName').textContent;
  navigator.clipboard.writeText(name);

  // Save to list
  if (!savedNames.includes(name) && name !== 'Click to generate...') {
    savedNames.unshift(name);
    if (savedNames.length > 10) savedNames.pop();
    saveSavedNames();
    renderSavedNames();
  }

  showToast('Name copied & saved!');
}

function renderSavedNames() {
  const container = document.getElementById('savedNamesList');
  if (savedNames.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim);">Copy names to save them here.</p>';
    return;
  }
  container.innerHTML = savedNames.map(name => `
    <div class="history-item">${escapeHtml(name)}</div>
  `).join('');
}

// ==================== STATS ====================

function initStats() {
  document.getElementById('statWorks').textContent = DATA.stats.works;
  document.getElementById('statWords').textContent = DATA.stats.words.toLocaleString();
  document.getElementById('statLines').textContent = DATA.stats.lines.toLocaleString();
  document.getElementById('statChunks').textContent = DATA.stats.chunks.toLocaleString();

  // Type breakdown
  const types = {};
  DATA.works.forEach(w => {
    types[w.type] = (types[w.type] || 0) + 1;
  });

  const typeContainer = document.getElementById('typeBreakdown');
  typeContainer.innerHTML = Object.entries(types).map(([type, count]) => `
    <div class="type-badge-large">
      <span class="count">${count}</span>
      <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </div>
  `).join('');

  // Word cloud (top words)
  generateWordCloud();
}

function generateWordCloud() {
  const stopWords = new Set(['the', 'and', 'to', 'of', 'a', 'i', 'in', 'that', 'is', 'you', 'it', 'my', 'for', 'with', 'not', 'be', 'his', 'but', 'as', 'have', 'he', 'this', 'thy', 'will', 'me', 'your', 'what', 'her', 'all', 'are', 'no', 'so', 'do', 'if', 'from', 'we', 'they', 'our', 'shall', 'on', 'him', 'by', 'was', 'or', 'them', 'an', 'thee', 'which', 'their', 'hath', 'would', 'she', 'doth', 'at', 'more', 'than', 'how', 'then', 'come', 'now', 'let', 'upon', 'here', 'when', 'one', 'there', 'thou']);

  const wordCounts = {};

  // Sample chunks for performance
  const sampleChunks = DATA.chunks.filter((_, i) => i % 5 === 0);

  sampleChunks.forEach(chunk => {
    const words = chunk.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60);

  const maxCount = sorted[0]?.[1] || 1;
  const minCount = sorted[sorted.length - 1]?.[1] || 1;

  const container = document.getElementById('wordCloud');
  container.innerHTML = sorted.map(([word, count]) => {
    const size = 0.8 + ((count - minCount) / (maxCount - minCount)) * 1.2;
    const opacity = 0.5 + ((count - minCount) / (maxCount - minCount)) * 0.5;
    return `<span class="cloud-word" style="font-size:${size}rem; opacity:${opacity};" title="${count} occurrences">${word}</span>`;
  }).join('');
}

// ==================== KEYBOARD ====================

function initKeyboard() {
  document.getElementById('themeToggle').addEventListener('click', cycleTheme);

  document.addEventListener('keydown', (e) => {
    // Ignore if in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }

    switch (e.key) {
      case '/':
        e.preventDefault();
        document.getElementById('searchInput').focus();
        break;
      case 't':
        cycleTheme();
        break;
      case 'r':
        // Random action based on current view
        const activeView = document.querySelector('.view.active')?.id;
        if (activeView === 'quote-view') showRandomQuote();
        else if (activeView === 'insult-view') generateInsult();
        else if (activeView === 'names-view') generateName();
        break;
      case '?':
        document.getElementById('keyboardHelp').classList.toggle('visible');
        break;
      case 'Escape':
        document.getElementById('keyboardHelp').classList.remove('visible');
        break;
      case '1': case '2': case '3': case '4': case '5': case '6':
        const tabs = document.querySelectorAll('.tab');
        const index = parseInt(e.key) - 1;
        if (tabs[index]) tabs[index].click();
        break;
      case 'ArrowLeft':
        if (document.querySelector('#search-view.active')) {
          document.getElementById('prevPage').click();
        }
        break;
      case 'ArrowRight':
        if (document.querySelector('#search-view.active')) {
          document.getElementById('nextPage').click();
        }
        break;
    }
  });
}

// Toast notification
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--accent); color:white; padding:12px 24px; border-radius:8px; z-index:1000; opacity:0; transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// Start
document.addEventListener('DOMContentLoaded', init);
