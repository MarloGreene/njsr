/**
 * Codex - Text Explorer
 * A unified text search and exploration tool.
 */

// State
let DATA = null;
let selectedWorks = new Set();
let userFiles = {};
let currentView = 'results';
let currentCategory = 'all';
let searchResults = [];
let currentPage = 0;
const ITEMS_PER_PAGE = 25;

// Theme
let currentTheme = localStorage.getItem('codex-theme') || 'default';

// ==================== INITIALIZATION ====================

async function init() {
  try {
    // Load built-in corpus
    const response = await fetch('codex-data.json');
    if (response.ok) {
      DATA = await response.json();
    } else {
      DATA = { works: [], chunks: [], stats: { workCount: 0, chunkCount: 0, wordCount: 0 }, categories: [] };
    }

    // Load user files from localStorage
    loadUserFiles();

    // Initialize UI
    renderFileGrid();
    initEventListeners();
    setTheme(currentTheme);

    // Hide loading
    document.getElementById('loading').classList.add('hidden');

    // Show initial state
    updateResultsHeader();

  } catch (err) {
    console.error('Failed to initialize:', err);
    document.getElementById('loading').innerHTML = `
      <p style="color: #c00;">Failed to load Codex data.</p>
      <p style="color: #666; margin-top: 8px;">Run: <code>node preprocess.js</code></p>
    `;
  }
}

// ==================== THEME ====================

function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('codex-theme', theme);

  const btn = document.getElementById('themeToggle');
  btn.textContent = theme === 'dark' ? '☀️' : theme === 'sepia' ? '📜' : '🌙';
}

function cycleTheme() {
  const themes = ['default', 'dark', 'sepia'];
  const next = (themes.indexOf(currentTheme) + 1) % themes.length;
  setTheme(themes[next]);
}

// ==================== USER FILES ====================

function loadUserFiles() {
  try {
    const saved = localStorage.getItem('codex-user-files');
    if (saved) {
      userFiles = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load user files:', e);
  }
}

function saveUserFiles() {
  try {
    localStorage.setItem('codex-user-files', JSON.stringify(userFiles));
  } catch (e) {
    console.error('Failed to save user files:', e);
    alert('Failed to save file - localStorage may be full.');
  }
}

function addUserFile(filename, content) {
  const id = 'user_' + filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  // Chunk the content
  const chunks = [];
  const paragraphs = content.split(/\n\n+/);
  let chunkIndex = 0;

  let currentChunk = '';
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > 500 && currentChunk.length > 0) {
      chunks.push({
        id: `${id}_${chunkIndex}`,
        index: chunkIndex++,
        workId: id,
        text: currentChunk.trim(),
        searchText: currentChunk.trim().toLowerCase()
      });
      currentChunk = '';
    }
    currentChunk += para + '\n\n';
  }

  if (currentChunk.trim()) {
    chunks.push({
      id: `${id}_${chunkIndex}`,
      index: chunkIndex,
      workId: id,
      text: currentChunk.trim(),
      searchText: currentChunk.trim().toLowerCase()
    });
  }

  userFiles[id] = {
    id: id,
    filename: filename,
    title: filename.replace(/\.(txt|md)$/i, ''),
    category: 'user',
    icon: '📄',
    wordCount: content.split(/\s+/).length,
    chunkCount: chunks.length,
    chunks: chunks,
    content: content
  };

  saveUserFiles();
  renderFileGrid();
}

function removeUserFile(id) {
  delete userFiles[id];
  selectedWorks.delete(id);
  saveUserFiles();
  renderFileGrid();
  performSearch();
}

// ==================== FILE GRID ====================

// Track expanded groups
let expandedGroups = new Set();

function renderFileGrid() {
  const grid = document.getElementById('fileGrid');
  grid.innerHTML = '';

  // Get all works (built-in + user)
  const allWorks = getAllWorks();

  // Filter by category
  const filtered = currentCategory === 'all'
    ? allWorks
    : allWorks.filter(w => w.category === currentCategory);

  // Group works by category for collapsible display
  const groups = {};
  const standalone = [];

  for (const work of filtered) {
    // Shakespeare gets grouped, others shown individually
    if (work.category === 'shakespeare') {
      if (!groups.shakespeare) groups.shakespeare = [];
      groups.shakespeare.push(work);
    } else {
      standalone.push(work);
    }
  }

  // Render Shakespeare group folder (if any)
  if (groups.shakespeare && groups.shakespeare.length > 0) {
    const shakespeareWorks = groups.shakespeare;
    const selectedCount = shakespeareWorks.filter(w => selectedWorks.has(w.id)).length;
    const isExpanded = expandedGroups.has('shakespeare');

    // Group folder
    const folder = document.createElement('div');
    folder.className = 'file-group';

    const folderHeader = document.createElement('div');
    folderHeader.className = 'file-item file-folder' + (selectedCount > 0 ? ' has-selected' : '');
    folderHeader.innerHTML = `
      <span class="file-icon">${isExpanded ? '📂' : '📁'}</span>
      <span class="file-name">Shakespeare</span>
      ${selectedCount > 0 ? `<span class="selection-badge">${selectedCount}</span>` : ''}
      <span class="expand-arrow">${isExpanded ? '▼' : '▶'}</span>
    `;

    folderHeader.addEventListener('click', (e) => {
      if (e.shiftKey) {
        // Shift+click selects/deselects all
        const allSelected = shakespeareWorks.every(w => selectedWorks.has(w.id));
        shakespeareWorks.forEach(w => {
          if (allSelected) {
            selectedWorks.delete(w.id);
          } else {
            selectedWorks.add(w.id);
          }
        });
        renderFileGrid();
        updateResultsHeader();
        performSearch();
      } else {
        // Toggle expand/collapse
        if (expandedGroups.has('shakespeare')) {
          expandedGroups.delete('shakespeare');
        } else {
          expandedGroups.add('shakespeare');
        }
        renderFileGrid();
      }
    });

    folder.appendChild(folderHeader);

    // Expanded items
    if (isExpanded) {
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'file-group-items';

      shakespeareWorks.forEach(work => {
        const item = document.createElement('div');
        item.className = 'file-item file-group-item' + (selectedWorks.has(work.id) ? ' selected' : '');
        item.dataset.id = work.id;
        item.innerHTML = `
          <span class="file-icon">📜</span>
          <span class="file-name" title="${escapeHtml(work.title)}">${escapeHtml(truncate(work.title, 14))}</span>
        `;
        item.addEventListener('click', () => toggleWorkSelection(work.id));
        itemsContainer.appendChild(item);
      });

      folder.appendChild(itemsContainer);
    }

    grid.appendChild(folder);
  }

  // Render standalone files (scripture, user files)
  standalone.forEach(work => {
    const item = document.createElement('div');
    item.className = 'file-item' + (selectedWorks.has(work.id) ? ' selected' : '') +
                     (work.category === 'user' ? ' user-file' : '');
    item.dataset.id = work.id;
    item.innerHTML = `
      <span class="file-icon">${work.icon}</span>
      <span class="file-name" title="${escapeHtml(work.title)}">${escapeHtml(truncate(work.title, 12))}</span>
    `;

    item.addEventListener('click', (e) => {
      if (e.shiftKey && work.category === 'user') {
        if (confirm(`Remove "${work.title}" from your files?`)) {
          removeUserFile(work.id);
        }
        return;
      }
      toggleWorkSelection(work.id);
    });

    grid.appendChild(item);
  });

  updateSearchHint();
}

function toggleWorkSelection(id) {
  if (selectedWorks.has(id)) {
    selectedWorks.delete(id);
  } else {
    selectedWorks.add(id);
  }

  renderFileGrid();
  updateResultsHeader();
  updateSearchHint();

  // Re-run search if there's a query
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    performSearch();
  }
}

function getAllWorks() {
  const works = [...(DATA?.works || [])];

  // Add user files
  for (const id in userFiles) {
    works.push(userFiles[id]);
  }

  return works;
}

function getWorkById(id) {
  const work = DATA?.works?.find(w => w.id === id);
  if (work) return work;
  return userFiles[id] || null;
}

function getChunksForWork(workId) {
  // Check user files first
  if (userFiles[workId]) {
    return userFiles[workId].chunks;
  }

  // Otherwise search built-in chunks
  return DATA?.chunks?.filter(c => c.workId === workId) || [];
}

// ==================== SEARCH ====================

function performSearch() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();

  if (!query || selectedWorks.size === 0) {
    searchResults = [];
    currentPage = 0;
    renderResults();
    return;
  }

  // Gather chunks from selected works
  let chunks = [];

  for (const workId of selectedWorks) {
    const workChunks = getChunksForWork(workId);
    chunks = chunks.concat(workChunks);
  }

  // Filter by query
  const terms = query.split(/\s+/).filter(t => t.length > 0);

  searchResults = chunks.filter(chunk => {
    const text = chunk.searchText;
    return terms.every(term => text.includes(term));
  });

  // Score and sort by relevance
  searchResults.forEach(chunk => {
    let score = 0;
    for (const term of terms) {
      const matches = (chunk.searchText.match(new RegExp(escapeRegex(term), 'g')) || []).length;
      score += matches;
    }
    chunk._score = score;
  });

  searchResults.sort((a, b) => b._score - a._score);

  currentPage = 0;
  renderResults(query);
}

function renderResults(query = '') {
  const list = document.getElementById('resultsList');
  const pagination = document.getElementById('pagination');

  updateResultsHeader();

  if (selectedWorks.size === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>Click on texts above to select them, then search or explore stats.</p>
      </div>
    `;
    pagination.classList.add('hidden');
    return;
  }

  if (searchResults.length === 0) {
    const q = document.getElementById('searchInput').value.trim();
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${q ? '🔍' : '✨'}</div>
        <p>${q ? `No results for "${escapeHtml(q)}"` : 'Type to search across selected texts'}</p>
      </div>
    `;
    pagination.classList.add('hidden');
    return;
  }

  // Paginate
  const start = currentPage * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageResults = searchResults.slice(start, end);

  list.innerHTML = pageResults.map(chunk => {
    const work = getWorkById(chunk.workId);
    return `
      <div class="result-item" data-work-id="${chunk.workId}" data-chunk-index="${chunk.index}">
        <div class="result-meta">
          <span class="result-source">${work?.icon || '📄'} ${escapeHtml(work?.title || chunk.workId)}</span>
          <span class="result-location">Passage ${chunk.index + 1}</span>
        </div>
        <div class="result-text">${highlight(truncate(chunk.text, 300), query)}</div>
      </div>
    `;
  }).join('');

  // Add click handlers
  list.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', () => {
      const workId = item.dataset.workId;
      const chunkIndex = parseInt(item.dataset.chunkIndex);
      showReader(workId, chunkIndex);
    });
  });

  // Pagination
  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE);
  if (totalPages > 1) {
    pagination.classList.remove('hidden');
    document.getElementById('pageInfo').textContent = `Page ${currentPage + 1} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 0;
    document.getElementById('nextPage').disabled = currentPage >= totalPages - 1;
  } else {
    pagination.classList.add('hidden');
  }
}

function updateResultsHeader() {
  const header = document.getElementById('resultCount');
  const selectedCount = selectedWorks.size;

  if (selectedCount === 0) {
    header.textContent = 'Select texts to begin exploring';
  } else if (searchResults.length > 0) {
    header.textContent = `${searchResults.length.toLocaleString()} results in ${selectedCount} text${selectedCount !== 1 ? 's' : ''}`;
  } else {
    const q = document.getElementById('searchInput').value.trim();
    if (q) {
      header.textContent = `No results in ${selectedCount} text${selectedCount !== 1 ? 's' : ''}`;
    } else {
      header.textContent = `${selectedCount} text${selectedCount !== 1 ? 's' : ''} selected`;
    }
  }
}

function updateSearchHint() {
  const hint = document.getElementById('searchHint');
  const count = selectedWorks.size;
  hint.textContent = count > 0 ? `${count} selected` : '';
}

// ==================== READER VIEW ====================

function showReader(workId, chunkIndex = 0) {
  const work = getWorkById(workId);
  const chunks = getChunksForWork(workId);

  if (!work || chunks.length === 0) return;

  document.getElementById('resultsView').classList.add('hidden');
  document.getElementById('readerView').classList.remove('hidden');
  document.getElementById('readerTitle').textContent = work.title;

  currentView = 'reader';
  window._readerWorkId = workId;
  window._readerChunkIndex = chunkIndex;

  renderReaderContent(chunks, chunkIndex);
}

function renderReaderContent(chunks, focusIndex) {
  const content = document.getElementById('readerContent');
  const query = document.getElementById('searchInput').value.trim();

  // Show context around the focus chunk
  const startIdx = Math.max(0, focusIndex - 2);
  const endIdx = Math.min(chunks.length, focusIndex + 5);
  const visibleChunks = chunks.slice(startIdx, endIdx);

  content.innerHTML = visibleChunks.map((chunk, i) => {
    const actualIdx = startIdx + i;
    const isFocus = actualIdx === focusIndex;
    const text = query ? highlight(chunk.text, query) : escapeHtml(chunk.text);
    return `
      <div class="reader-chunk ${isFocus ? 'focus' : ''}" data-index="${actualIdx}">
        ${text}
      </div>
    `;
  }).join('\n\n');

  // Scroll to focus
  setTimeout(() => {
    const focusEl = content.querySelector('.focus');
    if (focusEl) {
      focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

function hideReader() {
  document.getElementById('readerView').classList.add('hidden');
  document.getElementById('resultsView').classList.remove('hidden');
  currentView = 'results';
}

// ==================== STATS ====================

function showStats(type) {
  const content = document.getElementById('statsContent');

  if (selectedWorks.size === 0) {
    content.innerHTML = '<p class="stats-placeholder">Select texts first to see statistics.</p>';
    return;
  }

  // Gather all text from selected works
  let allText = '';
  for (const workId of selectedWorks) {
    const chunks = getChunksForWork(workId);
    for (const chunk of chunks) {
      allText += chunk.text + ' ';
    }
  }

  const words = allText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3);

  // Stop words to filter out
  const stopWords = new Set(['that', 'this', 'with', 'have', 'will', 'your', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'would', 'there', 'could', 'other', 'into', 'more', 'some', 'than', 'them', 'these', 'then', 'what', 'when', 'made', 'upon', 'unto', 'shall', 'hath', 'thee', 'thou', 'also', 'like']);

  // Count frequencies
  const freq = {};
  for (const word of words) {
    if (!stopWords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  switch (type) {
    case 'wordcloud':
      renderWordCloud(content, sorted.slice(0, 80));
      break;
    case 'frequency':
      renderFrequency(content, sorted.slice(0, 50));
      break;
    case 'random':
      renderRandomVerse(content);
      break;
  }

  // Update button states
  document.querySelectorAll('.stat-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(type === 'wordcloud' ? 'wordCloudBtn' : type === 'frequency' ? 'frequencyBtn' : 'randomBtn')?.classList.add('active');
}

function renderWordCloud(container, words) {
  const maxCount = words[0]?.[1] || 1;
  const minCount = words[words.length - 1]?.[1] || 1;

  container.innerHTML = `
    <div class="word-cloud">
      ${words.map(([word, count]) => {
        const size = 0.7 + ((count - minCount) / (maxCount - minCount)) * 1.3;
        const opacity = 0.5 + ((count - minCount) / (maxCount - minCount)) * 0.5;
        return `<span class="cloud-word" style="font-size:${size}rem; opacity:${opacity};" title="${count} occurrences">${escapeHtml(word)}</span>`;
      }).join('')}
    </div>
  `;
}

function renderFrequency(container, words) {
  container.innerHTML = `
    <div class="frequency-list">
      ${words.map(([word, count]) => `
        <div class="freq-item">
          <span>${escapeHtml(word)}</span>
          <span class="freq-count">${count.toLocaleString()}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderRandomVerse(container) {
  // Pick a random chunk from selected works
  const chunks = [];
  for (const workId of selectedWorks) {
    const workChunks = getChunksForWork(workId);
    for (const chunk of workChunks) {
      chunks.push({ ...chunk, workId });
    }
  }

  if (chunks.length === 0) {
    container.innerHTML = '<p class="stats-placeholder">No text available.</p>';
    return;
  }

  const chunk = chunks[Math.floor(Math.random() * chunks.length)];
  const work = getWorkById(chunk.workId);

  // Get a reasonable excerpt
  const lines = chunk.text.split('\n').filter(l => l.trim().length > 10);
  const line = lines[Math.floor(Math.random() * lines.length)] || chunk.text.slice(0, 200);

  container.innerHTML = `
    <div class="random-verse">
      <blockquote>"${escapeHtml(line.trim())}"</blockquote>
      <cite>— ${escapeHtml(work?.title || 'Unknown')}</cite>
      <br><br>
      <button class="stat-btn" onclick="showStats('random')">Another</button>
    </div>
  `;
}

// ==================== EVENT LISTENERS ====================

function initEventListeners() {
  // Search
  let debounce;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(performSearch, 150);
  });

  // Theme
  document.getElementById('themeToggle').addEventListener('click', cycleTheme);

  // Stats toggle
  document.getElementById('statsToggle').addEventListener('click', () => {
    document.getElementById('statsPanel').classList.toggle('hidden');
  });

  // Stats buttons
  document.getElementById('wordCloudBtn').addEventListener('click', () => showStats('wordcloud'));
  document.getElementById('frequencyBtn').addEventListener('click', () => showStats('frequency'));
  document.getElementById('randomBtn').addEventListener('click', () => showStats('random'));

  // Help
  document.getElementById('helpToggle').addEventListener('click', () => {
    document.getElementById('helpModal').classList.remove('hidden');
  });
  document.getElementById('closeHelp').addEventListener('click', () => {
    document.getElementById('helpModal').classList.add('hidden');
  });

  // Category filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderFileGrid();
    });
  });

  // Pagination
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      renderResults(document.getElementById('searchInput').value.trim());
    }
  });
  document.getElementById('nextPage').addEventListener('click', () => {
    const maxPage = Math.ceil(searchResults.length / ITEMS_PER_PAGE) - 1;
    if (currentPage < maxPage) {
      currentPage++;
      renderResults(document.getElementById('searchInput').value.trim());
    }
  });

  // Reader navigation
  document.getElementById('backToResults').addEventListener('click', hideReader);
  document.getElementById('readerPrev').addEventListener('click', () => {
    if (window._readerChunkIndex > 0) {
      window._readerChunkIndex--;
      const chunks = getChunksForWork(window._readerWorkId);
      renderReaderContent(chunks, window._readerChunkIndex);
    }
  });
  document.getElementById('readerNext').addEventListener('click', () => {
    const chunks = getChunksForWork(window._readerWorkId);
    if (window._readerChunkIndex < chunks.length - 1) {
      window._readerChunkIndex++;
      renderReaderContent(chunks, window._readerChunkIndex);
    }
  });

  // File drag-and-drop
  const dropZone = document.getElementById('fileDrop');

  dropZone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.text';
    input.onchange = (e) => handleFileSelect(e.target.files);
    input.click();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFileSelect(e.dataTransfer.files);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
}

function handleFileSelect(files) {
  for (const file of files) {
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        addUserFile(file.name, e.target.result);
      };
      reader.readAsText(file);
    }
  }
}

function handleKeyboard(e) {
  // Ignore if in input
  if (e.target.tagName === 'INPUT') {
    if (e.key === 'Escape') {
      e.target.value = '';
      performSearch();
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
    case 's':
      document.getElementById('statsPanel').classList.toggle('hidden');
      break;
    case 'r':
      showStats('random');
      break;
    case 'Escape':
      if (currentView === 'reader') {
        hideReader();
      } else {
        document.getElementById('helpModal').classList.add('hidden');
      }
      break;
    case 'ArrowLeft':
      document.getElementById('prevPage').click();
      break;
    case 'ArrowRight':
      document.getElementById('nextPage').click();
      break;
    case '?':
      document.getElementById('helpModal').classList.toggle('hidden');
      break;
    default:
      // Number keys 1-9 toggle file selection
      if (/^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key) - 1;
        const allWorks = getAllWorks();
        const filtered = currentCategory === 'all' ? allWorks : allWorks.filter(w => w.category === currentCategory);
        if (filtered[index]) {
          toggleWorkSelection(filtered[index].id);
        }
      }
  }
}

// ==================== UTILITIES ====================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);

  const escaped = escapeHtml(text);
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);

  let result = escaped;
  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    result = result.replace(regex, '<mark class="highlight">$1</mark>');
  }

  return result;
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// ==================== START ====================

document.addEventListener('DOMContentLoaded', init);
