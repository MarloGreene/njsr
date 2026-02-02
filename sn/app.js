/**
 * Security Now! Explorer - Main Application
 */

// Global state
let DATA = null;
let filteredEpisodes = [];
let trendsChart = null;
let lengthChart = null;
let yearlyChart = null;
let selectedTerms = new Set(['ransomware', 'ai']);
const ITEMS_PER_PAGE = 25;
let currentPage = 0;
let currentTheme = 'dark';

// Color palette for charts
const CHART_COLORS = [
  '#58a6ff', '#3fb950', '#d29922', '#f85149', '#a371f7',
  '#79c0ff', '#56d364', '#e3b341', '#ff7b72', '#bc8cff',
  '#39d353', '#db6d28', '#8b949e', '#f778ba', '#a5d6ff'
];

// Initialize app
async function init() {
  try {
    const response = await fetch('sn-data.json');
    DATA = await response.json();

    // Restore preferences from localStorage
    loadPreferences();

    // Initialize all views
    initSearch();
    initTrends();
    initCloud();
    initSteveIsms();
    initLeoIsms();
    initStats();

    // Set up tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Initialize theme
    initTheme();

    // Initialize keyboard navigation
    initKeyboardNav();

    // Hide loading
    document.getElementById('loading').classList.add('hidden');

    // Initial search
    performSearch();

  } catch (err) {
    console.error('Failed to load data:', err);
    document.getElementById('loading').innerHTML = `
      <p style="color: var(--red)">Failed to load data. Make sure sn-data.json exists.</p>
      <p style="color: var(--text-dim)">Run: node preprocess.js</p>
    `;
  }
}

function loadPreferences() {
  const prefs = JSON.parse(localStorage.getItem('sn-explorer-prefs') || '{}');
  if (prefs.selectedTerms) {
    selectedTerms = new Set(prefs.selectedTerms);
  }
  if (prefs.lastView) {
    const tab = document.querySelector(`[data-view="${prefs.lastView}"]`);
    if (tab) switchView(prefs.lastView);
  }
  if (prefs.theme) {
    currentTheme = prefs.theme;
  }
}

function savePreferences() {
  localStorage.setItem('sn-explorer-prefs', JSON.stringify({
    selectedTerms: [...selectedTerms],
    lastView: document.querySelector('.tab.active')?.dataset.view || 'search',
    theme: currentTheme
  }));
}

function switchView(viewName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
  document.getElementById(`${viewName}-view`)?.classList.add('active');

  savePreferences();

  // Refresh charts when switching to their views
  if (viewName === 'trends') updateTrendsChart();
  if (viewName === 'stats') updateStatsCharts();
}

// ==================== SEARCH ====================

function initSearch() {
  const searchInput = document.getElementById('search-input');
  const yearFilter = document.getElementById('year-filter');
  const sortOrder = document.getElementById('sort-order');

  // Populate year filter
  const years = [...new Set(DATA.episodes.map(e => e.y))].filter(y => y).sort((a, b) => b - a);
  years.forEach(year => {
    yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
  });

  // Event listeners with debounce
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSearch, 150);
  });

  yearFilter.addEventListener('change', performSearch);
  sortOrder.addEventListener('change', performSearch);
}

function performSearch() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const yearFilter = document.getElementById('year-filter').value;
  const sortOrder = document.getElementById('sort-order').value;

  // Filter episodes
  filteredEpisodes = DATA.episodes.filter(ep => {
    // Year filter
    if (yearFilter && ep.y !== parseInt(yearFilter)) return false;

    // Search filter
    if (query) {
      const searchable = `${ep.t} ${ep.desc} ${ep.st}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    return true;
  });

  // Calculate relevance scores if searching
  if (query) {
    filteredEpisodes.forEach(ep => {
      let score = 0;
      const searchable = `${ep.t} ${ep.desc} ${ep.st}`.toLowerCase();

      // Title match gets highest score
      if (ep.t.toLowerCase().includes(query)) score += 100;

      // Description match
      if (ep.desc.toLowerCase().includes(query)) score += 50;

      // Count occurrences
      const matches = searchable.split(query).length - 1;
      score += matches * 5;

      ep._score = score;
    });
  }

  // Sort
  switch (sortOrder) {
    case 'relevance':
      if (query) {
        filteredEpisodes.sort((a, b) => (b._score || 0) - (a._score || 0));
      } else {
        filteredEpisodes.sort((a, b) => b.n - a.n);
      }
      break;
    case 'newest':
      filteredEpisodes.sort((a, b) => b.n - a.n);
      break;
    case 'oldest':
      filteredEpisodes.sort((a, b) => a.n - b.n);
      break;
    case 'longest':
      filteredEpisodes.sort((a, b) => b.wc - a.wc);
      break;
  }

  currentPage = 0;
  renderResults(query);
}

function renderResults(query) {
  const results = document.getElementById('results');
  const countEl = document.getElementById('result-count');

  countEl.textContent = `${filteredEpisodes.length} episodes`;

  if (filteredEpisodes.length === 0) {
    results.innerHTML = `
      <div class="no-results">
        <h3>No episodes found</h3>
        <p>Try a different search term or adjust filters</p>
      </div>
    `;
    return;
  }

  const startIdx = currentPage * ITEMS_PER_PAGE;
  const pageEpisodes = filteredEpisodes.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  let html = '';
  pageEpisodes.forEach(ep => {
    let desc = ep.desc || '';
    if (query && desc.toLowerCase().includes(query)) {
      const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
      desc = desc.replace(regex, '<mark>$1</mark>');
    }

    html += `
      <div class="episode-card" onclick="openEpisode(${ep.n})">
        <div class="episode-header">
          <span class="episode-number">#${ep.n}</span>
          <span class="episode-title">${escapeHtml(ep.t)}${ep.y ? `<span class="episode-year-badge">${ep.y}</span>` : ''}</span>
          <span class="episode-date">${ep.d}</span>
        </div>
        <div class="episode-desc">${desc}</div>
        <div class="episode-meta">
          <span>📝 ${ep.wc.toLocaleString()} words</span>
          ${getSpeakerInfo(ep.sp)}
        </div>
      </div>
    `;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEpisodes.length / ITEMS_PER_PAGE);
  if (totalPages > 1) {
    html += `
      <div class="pagination">
        <button onclick="changePage(-1)" ${currentPage === 0 ? 'disabled' : ''}>← Prev</button>
        <span>Page ${currentPage + 1} of ${totalPages}</span>
        <button onclick="changePage(1)" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      </div>
    `;
  }

  results.innerHTML = html;
}

function changePage(delta) {
  const totalPages = Math.ceil(filteredEpisodes.length / ITEMS_PER_PAGE);
  currentPage = Math.max(0, Math.min(totalPages - 1, currentPage + delta));
  renderResults(document.getElementById('search-input').value.toLowerCase().trim());
  document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function getSpeakerInfo(speakers) {
  if (!speakers || Object.keys(speakers).length === 0) return '';
  const total = Object.values(speakers).reduce((a, b) => a + b, 0);
  const steve = speakers['STEVE'] || speakers['STEVE GIBSON'] || 0;
  const leo = speakers['LEO'] || speakers['LEO LAPORTE'] || 0;

  if (steve + leo === 0) return '';

  const stevePercent = Math.round((steve / (steve + leo)) * 100);
  return `<span>🎙️ Steve ${stevePercent}%</span>`;
}

function openEpisode(num) {
  // Open transcript file or GRC page
  const ep = DATA.episodes.find(e => e.n === num);
  if (ep) {
    window.open(`https://www.grc.com/sn/sn-${String(num).padStart(3, '0')}.htm`, '_blank');
  }
}

// ==================== TRENDS ====================

function initTrends() {
  const container = document.getElementById('term-buttons');

  DATA.stats.trackedTerms.forEach(term => {
    const btn = document.createElement('button');
    btn.className = `term-btn ${selectedTerms.has(term) ? 'active' : ''}`;
    btn.textContent = term;
    btn.onclick = () => toggleTerm(term, btn);
    container.appendChild(btn);
  });

  document.getElementById('normalize-chart').addEventListener('change', updateTrendsChart);
}

function toggleTerm(term, btn) {
  if (selectedTerms.has(term)) {
    selectedTerms.delete(term);
    btn.classList.remove('active');
  } else {
    if (selectedTerms.size >= 8) {
      // Remove oldest
      const first = selectedTerms.values().next().value;
      selectedTerms.delete(first);
      document.querySelector(`.term-btn.active`)?.classList.remove('active');
    }
    selectedTerms.add(term);
    btn.classList.add('active');
  }
  savePreferences();
  updateTrendsChart();
}

function updateTrendsChart() {
  const ctx = document.getElementById('trends-chart').getContext('2d');
  const normalize = document.getElementById('normalize-chart').checked;

  const years = Object.keys(DATA.yearlyTrends).sort();
  const datasets = [];

  let colorIdx = 0;
  for (const term of selectedTerms) {
    const data = years.map(year => {
      const yearData = DATA.yearlyTrends[year];
      const count = yearData.terms[term] || 0;
      return normalize ? (count / yearData.episodeCount) : count;
    });

    datasets.push({
      label: term,
      data,
      borderColor: CHART_COLORS[colorIdx % CHART_COLORS.length],
      backgroundColor: CHART_COLORS[colorIdx % CHART_COLORS.length] + '33',
      tension: 0.3,
      fill: false
    });
    colorIdx++;
  }

  if (trendsChart) trendsChart.destroy();

  trendsChart = new Chart(ctx, {
    type: 'line',
    data: { labels: years, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: { color: '#e6edf3' }
        },
        tooltip: {
          backgroundColor: '#161b22',
          borderColor: '#30363d',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: { color: '#8b949e' },
          grid: { color: '#21262d' }
        },
        y: {
          ticks: { color: '#8b949e' },
          grid: { color: '#21262d' },
          title: {
            display: true,
            text: normalize ? 'Mentions per Episode' : 'Total Mentions',
            color: '#8b949e'
          }
        }
      }
    }
  });

  // Generate insights
  generateTrendInsights(years);
}

function generateTrendInsights(years) {
  const insights = document.getElementById('trend-insights');
  const items = [];

  for (const term of selectedTerms) {
    // Find peak year
    let peakYear = years[0];
    let peakCount = 0;

    for (const year of years) {
      const count = DATA.yearlyTrends[year].terms[term] || 0;
      if (count > peakCount) {
        peakCount = count;
        peakYear = year;
      }
    }

    // Check recent trend
    const recent = years.slice(-3);
    const recentCounts = recent.map(y => DATA.yearlyTrends[y].terms[term] || 0);
    const isRising = recentCounts[2] > recentCounts[0];

    if (peakCount > 0) {
      items.push(`<li><strong>${term}</strong>: peaked in ${peakYear} (${peakCount} mentions), ${isRising ? '📈 rising' : '📉 declining'} recently</li>`);
    }
  }

  insights.innerHTML = items.length > 0
    ? `<h4>Trend Insights</h4><ul>${items.join('')}</ul>`
    : '<p style="color: var(--text-dim)">Select terms above to see trend insights</p>';
}

// ==================== WORD CLOUD ====================

function initCloud() {
  const minSlider = document.getElementById('cloud-min');
  const maxSlider = document.getElementById('cloud-max');
  const minVal = document.getElementById('cloud-min-val');
  const maxVal = document.getElementById('cloud-max-val');

  minSlider.addEventListener('input', () => {
    minVal.textContent = minSlider.value;
    renderCloud();
  });

  maxSlider.addEventListener('input', () => {
    maxVal.textContent = maxSlider.value;
    renderCloud();
  });

  // Reshuffle button
  document.getElementById('reshuffle-cloud').addEventListener('click', renderCloud);

  renderCloud();
}

function renderCloud() {
  const container = document.getElementById('word-cloud');
  const minFreq = parseInt(document.getElementById('cloud-min').value);
  const maxWords = parseInt(document.getElementById('cloud-max').value);

  const words = Object.entries(DATA.wordFrequencies)
    .filter(([word, count]) => count >= minFreq)
    .slice(0, maxWords);

  if (words.length === 0) {
    container.innerHTML = '<p style="color: var(--text-dim)">Adjust sliders to show words</p>';
    return;
  }

  const maxCount = Math.max(...words.map(([, c]) => c));
  const minCount = Math.min(...words.map(([, c]) => c));

  // Shuffle for visual variety
  const shuffled = words.sort(() => Math.random() - 0.5);

  container.innerHTML = shuffled.map(([word, count]) => {
    // Use logarithmic scale for better distribution (Zipf's law)
    const logMin = Math.log(minCount);
    const logMax = Math.log(maxCount);
    const normalized = (Math.log(count) - logMin) / (logMax - logMin || 1);

    // More extreme size range: 0.5rem to 4.5rem
    const size = 0.5 + normalized * 4;

    // More dramatic color: cyan (180) to magenta (320), higher saturation for prominence
    const hue = 180 + normalized * 140;
    const saturation = 50 + normalized * 40; // 50% to 90%
    const lightness = 45 + normalized * 30; // 45% to 75%

    return `<span class="cloud-word" style="font-size: ${size}rem; color: hsl(${hue}, ${saturation}%, ${lightness}%)"
                  onclick="searchWord('${word}')" title="${count.toLocaleString()} occurrences">${word}</span>`;
  }).join(' ');
}

function searchWord(word) {
  document.getElementById('search-input').value = word;
  switchView('search');
  performSearch();
}

// ==================== STATS ====================

function initStats() {
  // Basic stats
  document.getElementById('stat-episodes').textContent = DATA.stats.totalEpisodes.toLocaleString();
  document.getElementById('stat-words').textContent = (DATA.stats.totalWords / 1000000).toFixed(1) + 'M';

  const years = Object.keys(DATA.yearlyTrends).sort();
  document.getElementById('stat-years').textContent = years.length;
  document.getElementById('stat-avg').textContent = DATA.stats.avgWordsPerEpisode.toLocaleString();

  // Generate sparklines
  const episodesPerYear = years.map(y => DATA.yearlyTrends[y].episodeCount);
  const wordsPerYear = years.map(y => DATA.yearlyTrends[y].totalWords || DATA.yearlyTrends[y].episodeCount * 13000);
  const avgWordsPerYear = years.map(y => {
    const yt = DATA.yearlyTrends[y];
    return yt.totalWords ? Math.round(yt.totalWords / yt.episodeCount) : 13000;
  });

  renderSparkline('spark-episodes', episodesPerYear);
  renderSparkline('spark-words', wordsPerYear);
  renderSparkline('spark-years', years.map((_, i) => i + 1)); // Cumulative years
  renderSparkline('spark-avg', avgWordsPerYear);

  // Top episodes
  const sorted = [...DATA.episodes].sort((a, b) => b.wc - a.wc).slice(0, 10);
  document.getElementById('longest-list').innerHTML = sorted.map(ep => `
    <div class="top-episode" onclick="openEpisode(${ep.n})" style="cursor: pointer">
      <span class="top-episode-title">#${ep.n}: ${escapeHtml(ep.t)}</span>
      <span class="top-episode-words">${ep.wc.toLocaleString()} words</span>
    </div>
  `).join('');
}

function renderSparkline(elementId, data) {
  const container = document.getElementById(elementId);
  if (!container || data.length === 0) return;

  const width = 100;
  const height = 30;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <path class="area" d="${areaPath}" />
      <path d="${linePath}" />
    </svg>
  `;
}

function updateStatsCharts() {
  // Episode length chart
  const lengthCtx = document.getElementById('length-chart').getContext('2d');

  // Group by 50-episode chunks for smoother visualization
  const chunkSize = 25;
  const chunks = [];
  for (let i = 0; i < DATA.episodes.length; i += chunkSize) {
    const chunk = DATA.episodes.slice(i, i + chunkSize);
    const avgWc = Math.round(chunk.reduce((a, e) => a + e.wc, 0) / chunk.length);
    chunks.push({
      label: `${i + 1}-${Math.min(i + chunkSize, DATA.episodes.length)}`,
      value: avgWc
    });
  }

  if (lengthChart) lengthChart.destroy();
  lengthChart = new Chart(lengthCtx, {
    type: 'bar',
    data: {
      labels: chunks.map(c => c.label),
      datasets: [{
        label: 'Avg Words per Episode',
        data: chunks.map(c => c.value),
        backgroundColor: '#58a6ff66',
        borderColor: '#58a6ff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.5,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#8b949e', maxRotation: 45 },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#8b949e' },
          grid: { color: '#21262d' }
        }
      }
    }
  });

  // Episodes per year chart
  const yearlyCtx = document.getElementById('yearly-chart').getContext('2d');
  const years = Object.keys(DATA.yearlyTrends).sort();

  if (yearlyChart) yearlyChart.destroy();
  yearlyChart = new Chart(yearlyCtx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: 'Episodes',
        data: years.map(y => DATA.yearlyTrends[y].episodeCount),
        backgroundColor: '#3fb95066',
        borderColor: '#3fb950',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.5,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#8b949e' },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#8b949e' },
          grid: { color: '#21262d' }
        }
      }
    }
  });
}

// ==================== STEVE-ISMS ====================

function initSteveIsms() {
  // Populate category filter
  const categories = [...new Set(
    Object.values(DATA.steveIsms).map(s => s.category)
  )].sort();

  const categoryFilter = document.getElementById('category-filter');
  categories.forEach(cat => {
    categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
  });

  categoryFilter.addEventListener('change', renderSteveIsmsGrid);

  // Random quote button
  document.getElementById('random-quote-btn').addEventListener('click', showRandomQuote);

  // Initial render
  renderSteveIsmsGrid();
}

function renderSteveIsmsGrid() {
  const grid = document.getElementById('steveisms-grid');
  const categoryFilter = document.getElementById('category-filter').value;

  // Get phrases sorted by count
  const phrases = Object.entries(DATA.steveIsms)
    .filter(([phrase, data]) => !categoryFilter || data.category === categoryFilter)
    .sort((a, b) => b[1].count - a[1].count);

  grid.innerHTML = phrases.map(([phrase, data]) => `
    <div class="phrase-card" onclick="showPhraseQuotes('${escapeHtml(phrase)}')">
      <div class="phrase-text">"${escapeHtml(phrase)}"</div>
      <div class="phrase-count">${data.count.toLocaleString()}</div>
      <div class="phrase-category">${data.category}</div>
    </div>
  `).join('');
}

function showRandomQuote() {
  // Get all phrases with quotes
  const phrasesWithQuotes = Object.entries(DATA.steveIsms)
    .filter(([phrase, data]) => data.quotes && data.quotes.length > 0);

  if (phrasesWithQuotes.length === 0) return;

  // Pick random phrase
  const [phrase, data] = phrasesWithQuotes[Math.floor(Math.random() * phrasesWithQuotes.length)];

  // Pick random quote from that phrase
  const quote = data.quotes[Math.floor(Math.random() * data.quotes.length)];

  displayQuote(quote, phrase);
}

function displayQuote(quote, phrase) {
  const textEl = document.getElementById('quote-text');
  const citeEl = document.getElementById('quote-cite');

  // Convert **text** to <strong>text</strong>
  let text = quote.text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  textEl.innerHTML = `"${text}"`;
  citeEl.innerHTML = `— Episode #${quote.ep}: <a href="https://www.grc.com/sn/sn-${String(quote.ep).padStart(3, '0')}.htm" target="_blank">${escapeHtml(quote.title)}</a>`;
}

function showPhraseQuotes(phrase) {
  const data = DATA.steveIsms[phrase];
  if (!data || !data.quotes) return;

  const panel = document.getElementById('phrase-quotes');
  const titleEl = document.getElementById('panel-phrase-title');
  const listEl = document.getElementById('panel-quotes-list');

  titleEl.textContent = `"${phrase}" (${data.count.toLocaleString()} times)`;

  listEl.innerHTML = data.quotes.map(quote => {
    let text = quote.text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return `
      <div class="panel-quote">
        <p>${text}</p>
        <div class="quote-source">
          Episode #${quote.ep}: <a href="https://www.grc.com/sn/sn-${String(quote.ep).padStart(3, '0')}.htm" target="_blank">${escapeHtml(quote.title)}</a>
        </div>
      </div>
    `;
  }).join('');

  panel.classList.remove('hidden');

  // Show first quote in the main display too
  if (data.quotes.length > 0) {
    displayQuote(data.quotes[Math.floor(Math.random() * data.quotes.length)], phrase);
  }
}

function closeQuotesPanel() {
  document.getElementById('phrase-quotes').classList.add('hidden');
}

// ==================== LEO-ISMS ====================

function initLeoIsms() {
  // Populate category filter
  const categories = [...new Set(
    Object.values(DATA.leoIsms).map(s => s.category)
  )].sort();

  const categoryFilter = document.getElementById('leo-category-filter');
  categories.forEach(cat => {
    categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
  });

  categoryFilter.addEventListener('change', renderLeoIsmsGrid);

  // Random quote button
  document.getElementById('leo-random-quote-btn').addEventListener('click', showLeoRandomQuote);

  // Initial render
  renderLeoIsmsGrid();
}

function renderLeoIsmsGrid() {
  const grid = document.getElementById('leoisms-grid');
  const categoryFilter = document.getElementById('leo-category-filter').value;

  // Get phrases sorted by count
  const phrases = Object.entries(DATA.leoIsms)
    .filter(([phrase, data]) => !categoryFilter || data.category === categoryFilter)
    .sort((a, b) => b[1].count - a[1].count);

  grid.innerHTML = phrases.map(([phrase, data]) => `
    <div class="phrase-card" onclick="showLeoPhraseQuotes('${escapeHtml(phrase)}')">
      <div class="phrase-text">"${escapeHtml(phrase)}"</div>
      <div class="phrase-count">${data.count.toLocaleString()}</div>
      <div class="phrase-category">${data.category}</div>
    </div>
  `).join('');
}

function showLeoRandomQuote() {
  // Get all phrases with quotes
  const phrasesWithQuotes = Object.entries(DATA.leoIsms)
    .filter(([phrase, data]) => data.quotes && data.quotes.length > 0);

  if (phrasesWithQuotes.length === 0) return;

  // Pick random phrase
  const [phrase, data] = phrasesWithQuotes[Math.floor(Math.random() * phrasesWithQuotes.length)];

  // Pick random quote from that phrase
  const quote = data.quotes[Math.floor(Math.random() * data.quotes.length)];

  displayLeoQuote(quote, phrase);
}

function displayLeoQuote(quote, phrase) {
  const textEl = document.getElementById('leo-quote-text');
  const citeEl = document.getElementById('leo-quote-cite');

  // Convert **text** to <strong>text</strong>
  let text = quote.text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  textEl.innerHTML = `"${text}"`;
  citeEl.innerHTML = `— Episode #${quote.ep}: <a href="https://www.grc.com/sn/sn-${String(quote.ep).padStart(3, '0')}.htm" target="_blank">${escapeHtml(quote.title)}</a>`;
}

function showLeoPhraseQuotes(phrase) {
  const data = DATA.leoIsms[phrase];
  if (!data || !data.quotes) return;

  const panel = document.getElementById('leo-phrase-quotes');
  const titleEl = document.getElementById('leo-panel-phrase-title');
  const listEl = document.getElementById('leo-panel-quotes-list');

  titleEl.textContent = `"${phrase}" (${data.count.toLocaleString()} times)`;

  listEl.innerHTML = data.quotes.map(quote => {
    let text = quote.text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return `
      <div class="panel-quote">
        <p>${text}</p>
        <div class="quote-source">
          Episode #${quote.ep}: <a href="https://www.grc.com/sn/sn-${String(quote.ep).padStart(3, '0')}.htm" target="_blank">${escapeHtml(quote.title)}</a>
        </div>
      </div>
    `;
  }).join('');

  panel.classList.remove('hidden');

  // Show first quote in the main display too
  if (data.quotes.length > 0) {
    displayLeoQuote(data.quotes[Math.floor(Math.random() * data.quotes.length)], phrase);
  }
}

function closeLeoQuotesPanel() {
  document.getElementById('leo-phrase-quotes').classList.add('hidden');
}

// ==================== THEME ====================

function initTheme() {
  applyTheme(currentTheme);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
  savePreferences();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '🌙' : '☀️';
}

// ==================== KEYBOARD NAVIGATION ====================

function initKeyboardNav() {
  const shortcutsHelp = document.getElementById('shortcuts-help');
  const shortcutsToggle = document.getElementById('shortcuts-toggle');

  // Toggle shortcuts help
  shortcutsToggle.addEventListener('click', () => {
    shortcutsHelp.classList.toggle('hidden');
  });

  // Global keyboard handler
  document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
  // Ignore if typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    // Allow Escape to blur inputs
    if (e.key === 'Escape') {
      e.target.blur();
    }
    return;
  }

  const shortcutsHelp = document.getElementById('shortcuts-help');
  const currentView = document.querySelector('.tab.active')?.dataset.view || 'search';

  switch (e.key) {
    // Show help
    case '?':
      e.preventDefault();
      shortcutsHelp.classList.toggle('hidden');
      break;

    // Focus search (vim-style)
    case '/':
      e.preventDefault();
      document.getElementById('search-input').focus();
      switchView('search');
      break;

    // Toggle theme
    case 't':
      e.preventDefault();
      toggleTheme();
      break;

    // Navigate tabs left (vim h)
    case 'h':
    case 'ArrowLeft':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        navigateTabs(-1);
      }
      break;

    // Navigate tabs right (vim l)
    case 'l':
    case 'ArrowRight':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        navigateTabs(1);
      }
      break;

    // Next page / scroll down (vim j)
    case 'j':
    case 'ArrowDown':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (currentView === 'search') {
          changePage(1);
        }
      }
      break;

    // Previous page / scroll up (vim k)
    case 'k':
    case 'ArrowUp':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (currentView === 'search') {
          changePage(-1);
        }
      }
      break;

    // Close panels / help
    case 'Escape':
      e.preventDefault();
      closeQuotesPanel();
      closeLeoQuotesPanel();
      shortcutsHelp.classList.add('hidden');
      break;

    // Reshuffle cloud
    case 'r':
      e.preventDefault();
      if (currentView === 'cloud') {
        renderCloud();
      }
      break;

    // Random quote
    case 'q':
      e.preventDefault();
      if (currentView === 'steveisms') {
        showRandomQuote();
      } else if (currentView === 'leoisms') {
        showLeoRandomQuote();
      }
      break;

    // Number keys to switch tabs directly
    case '1': case '2': case '3': case '4': case '5': case '6':
      e.preventDefault();
      const tabs = document.querySelectorAll('.tab');
      const idx = parseInt(e.key) - 1;
      if (tabs[idx]) {
        switchView(tabs[idx].dataset.view);
      }
      break;

    // Go to first page (vim gg - need to track 'g' press)
    case 'g':
      if (e.repeat) {
        e.preventDefault();
        currentPage = 0;
        renderResults(document.getElementById('search-input').value.toLowerCase().trim());
      }
      break;

    // Go to last page (vim G)
    case 'G':
      e.preventDefault();
      if (currentView === 'search') {
        const totalPages = Math.ceil(filteredEpisodes.length / ITEMS_PER_PAGE);
        currentPage = Math.max(0, totalPages - 1);
        renderResults(document.getElementById('search-input').value.toLowerCase().trim());
      }
      break;
  }
}

function navigateTabs(direction) {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const activeIdx = tabs.findIndex(t => t.classList.contains('active'));
  const newIdx = (activeIdx + direction + tabs.length) % tabs.length;
  switchView(tabs[newIdx].dataset.view);
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
