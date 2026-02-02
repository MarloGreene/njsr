/**
 * Ministry of Grep - Search Engine
 *
 * Client-side search engine for text corpora.
 * Provides: search, filtering, highlighting, deep linking, pagination.
 */

class GrepEngine {
  constructor(options = {}) {
    this.corpus = null;
    this.chunks = [];
    this.works = [];
    this.filteredChunks = [];
    this.searchTerm = '';
    this.filters = {
      work: '',
      category: ''
    };

    // Options
    this.options = {
      resultsPerPage: options.resultsPerPage || 50,
      contextWords: options.contextWords || 15,
      debounceMs: options.debounceMs || 150,
      ...options
    };

    // State
    this.currentPage = 0;
    this.totalResults = 0;

    // Callbacks
    this.onResults = options.onResults || (() => {});
    this.onLoading = options.onLoading || (() => {});
    this.onError = options.onError || ((err) => console.error(err));

    // Debounce timer
    this._debounceTimer = null;
  }

  /**
   * Load corpus data from JSON
   */
  async loadCorpus(url) {
    this.onLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load: ${response.status}`);

      this.corpus = await response.json();
      this.chunks = this.corpus.chunks || [];
      this.works = this.corpus.works || [];
      this.filteredChunks = [...this.chunks];

      this.onLoading(false);
      return this.corpus;
    } catch (err) {
      this.onLoading(false);
      this.onError(err);
      throw err;
    }
  }

  /**
   * Get corpus metadata
   */
  getInfo() {
    if (!this.corpus) return null;
    return {
      title: this.corpus.title,
      subtitle: this.corpus.subtitle,
      author: this.corpus.author,
      description: this.corpus.description,
      stats: this.corpus.stats
    };
  }

  /**
   * Get list of works for filtering
   */
  getWorks() {
    return this.works;
  }

  /**
   * Get unique categories
   */
  getCategories() {
    const cats = new Set();
    for (const work of this.works) {
      if (work.category) cats.add(work.category);
    }
    return Array.from(cats).sort();
  }

  /**
   * Set filter and re-search
   */
  setFilter(key, value) {
    this.filters[key] = value;
    this.currentPage = 0;
    this._performSearch();
  }

  /**
   * Debounced search
   */
  search(term) {
    this.searchTerm = term.trim();
    this.currentPage = 0;

    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._performSearch();
    }, this.options.debounceMs);
  }

  /**
   * Immediate search (no debounce)
   */
  searchNow(term) {
    this.searchTerm = term.trim();
    this.currentPage = 0;
    this._performSearch();
  }

  /**
   * Core search logic
   */
  _performSearch() {
    const startTime = performance.now();

    let results = [...this.chunks];

    // Apply work filter
    if (this.filters.work) {
      results = results.filter(c => c.file === this.filters.work);
    }

    // Apply category filter
    if (this.filters.category) {
      const worksInCategory = this.works
        .filter(w => w.category === this.filters.category)
        .map(w => w.file);
      results = results.filter(c => worksInCategory.includes(c.file));
    }

    // Apply text search
    if (this.searchTerm) {
      const terms = this._parseSearchTerms(this.searchTerm);
      results = this._filterByTerms(results, terms);

      // Calculate relevance scores
      results = results.map(chunk => ({
        ...chunk,
        _score: this._scoreChunk(chunk, terms)
      }));

      // Sort by relevance
      results.sort((a, b) => b._score - a._score);
    }

    this.filteredChunks = results;
    this.totalResults = results.length;

    const endTime = performance.now();
    const searchTime = (endTime - startTime).toFixed(2);

    // Get current page results
    const pageResults = this._getPage(this.currentPage);

    this.onResults({
      results: pageResults,
      total: this.totalResults,
      page: this.currentPage,
      totalPages: Math.ceil(this.totalResults / this.options.resultsPerPage),
      searchTime,
      query: this.searchTerm
    });
  }

  /**
   * Parse search query into terms
   * Supports: "exact phrase", -exclude, regular terms
   */
  _parseSearchTerms(query) {
    const terms = {
      required: [],
      excluded: [],
      phrases: []
    };

    // Extract quoted phrases
    const phraseRegex = /"([^"]+)"/g;
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
      terms.phrases.push(match[1].toLowerCase());
    }

    // Remove phrases from query
    let remaining = query.replace(phraseRegex, '').trim();

    // Split remaining into words
    const words = remaining.split(/\s+/).filter(w => w);

    for (const word of words) {
      if (word.startsWith('-')) {
        const term = word.slice(1).toLowerCase();
        if (term) terms.excluded.push(term);
      } else {
        terms.required.push(word.toLowerCase());
      }
    }

    return terms;
  }

  /**
   * Filter chunks by parsed terms
   */
  _filterByTerms(chunks, terms) {
    return chunks.filter(chunk => {
      const text = chunk.searchText;

      // All phrases must match
      for (const phrase of terms.phrases) {
        if (!text.includes(phrase)) return false;
      }

      // All required terms must match
      for (const term of terms.required) {
        if (!text.includes(term)) return false;
      }

      // No excluded terms should match
      for (const term of terms.excluded) {
        if (text.includes(term)) return false;
      }

      return true;
    });
  }

  /**
   * Score chunk for relevance
   */
  _scoreChunk(chunk, terms) {
    let score = 0;
    const text = chunk.searchText;

    // Phrase matches score highest
    for (const phrase of terms.phrases) {
      const matches = (text.match(new RegExp(this._escapeRegex(phrase), 'gi')) || []).length;
      score += matches * 10;
    }

    // Required term matches
    for (const term of terms.required) {
      const matches = (text.match(new RegExp(this._escapeRegex(term), 'gi')) || []).length;
      score += matches * 5;
    }

    return score;
  }

  /**
   * Get paginated results
   */
  _getPage(pageNum) {
    const start = pageNum * this.options.resultsPerPage;
    const end = start + this.options.resultsPerPage;
    return this.filteredChunks.slice(start, end);
  }

  /**
   * Navigate pages
   */
  nextPage() {
    const maxPage = Math.ceil(this.totalResults / this.options.resultsPerPage) - 1;
    if (this.currentPage < maxPage) {
      this.currentPage++;
      this.onResults({
        results: this._getPage(this.currentPage),
        total: this.totalResults,
        page: this.currentPage,
        totalPages: maxPage + 1,
        query: this.searchTerm
      });
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.onResults({
        results: this._getPage(this.currentPage),
        total: this.totalResults,
        page: this.currentPage,
        totalPages: Math.ceil(this.totalResults / this.options.resultsPerPage),
        query: this.searchTerm
      });
    }
  }

  goToPage(pageNum) {
    const maxPage = Math.ceil(this.totalResults / this.options.resultsPerPage) - 1;
    this.currentPage = Math.max(0, Math.min(pageNum, maxPage));
    this.onResults({
      results: this._getPage(this.currentPage),
      total: this.totalResults,
      page: this.currentPage,
      totalPages: maxPage + 1,
      query: this.searchTerm
    });
  }

  /**
   * Highlight search terms in text
   */
  highlight(text, query = this.searchTerm) {
    if (!query) return this._escapeHtml(text);

    const terms = this._parseSearchTerms(query);
    let result = this._escapeHtml(text);

    // Highlight phrases first (longer matches)
    for (const phrase of terms.phrases) {
      const regex = new RegExp(`(${this._escapeRegex(phrase)})`, 'gi');
      result = result.replace(regex, '<mark class="highlight">$1</mark>');
    }

    // Highlight individual terms
    for (const term of terms.required) {
      const regex = new RegExp(`(${this._escapeRegex(term)})`, 'gi');
      result = result.replace(regex, '<mark class="highlight">$1</mark>');
    }

    return result;
  }

  /**
   * Get excerpt with context around match
   */
  excerpt(text, query = this.searchTerm, contextWords = this.options.contextWords) {
    if (!query) {
      // No query, return first N words
      const words = text.split(/\s+/);
      if (words.length <= contextWords * 2) return text;
      return words.slice(0, contextWords * 2).join(' ') + '...';
    }

    const terms = this._parseSearchTerms(query);
    const allTerms = [...terms.phrases, ...terms.required];
    if (allTerms.length === 0) return text;

    // Find first match position
    const lowerText = text.toLowerCase();
    let matchPos = -1;
    for (const term of allTerms) {
      const pos = lowerText.indexOf(term.toLowerCase());
      if (pos !== -1 && (matchPos === -1 || pos < matchPos)) {
        matchPos = pos;
      }
    }

    if (matchPos === -1) return text;

    // Find word boundaries around match
    const words = text.split(/\s+/);
    let charCount = 0;
    let matchWordIndex = 0;

    for (let i = 0; i < words.length; i++) {
      if (charCount >= matchPos) {
        matchWordIndex = i;
        break;
      }
      charCount += words[i].length + 1;
    }

    // Extract context
    const start = Math.max(0, matchWordIndex - contextWords);
    const end = Math.min(words.length, matchWordIndex + contextWords + 1);

    let excerpt = words.slice(start, end).join(' ');
    if (start > 0) excerpt = '...' + excerpt;
    if (end < words.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Generate deep link URL for a chunk
   */
  getDeepLink(chunk) {
    const params = new URLSearchParams();
    params.set('id', chunk.id);
    if (this.searchTerm) params.set('q', this.searchTerm);
    return `?${params.toString()}`;
  }

  /**
   * Find chunk by ID
   */
  getChunkById(id) {
    return this.chunks.find(c => c.id === id);
  }

  /**
   * Get chunks for a specific work
   */
  getWorkChunks(workFile) {
    return this.chunks.filter(c => c.file === workFile);
  }

  // Utility methods
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GrepEngine;
}
