#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = path.join(__dirname);
const toolsMdPath = path.join(rootDir, 'tools.md');
const indexHtmlPath = path.join(rootDir, 'tools', 'index.html');
const stylesCssPath = path.join(rootDir, 'tools', 'styles.css');
const scriptJsPath = path.join(rootDir, 'tools', 'script.js');

// Tool descriptions
const toolDescriptions = {
  '23': '23 Questions Answered by The Book of Mormon - Educational scripture quiz',
  'bom': 'Book of Mormon Reader - A web-based scripture reader for The Book of Mormon',
  'bomr': 'Book of Mormon Random Image Viewer - Random reverent imagery from The Book of Mormon',
  'buddy': 'Buddy Letter Assistant - VA PTSD claim support letter generator',
  'cal': 'Calendar - Simple yearly calendar display',
  'click': 'Metronome - Interactive musical metronome with BPM controls',
  'color': 'Color Picker - Advanced color selection with screen sampling',
  'colors': 'Color Palette Generator - Random palette creation with save/lock features',
  'countdown': 'Countdown Timer - Event countdown with date/time setting',
  'dice': 'Dice Roller - Polyhedral dice simulator with drag-and-drop tower',
  'foto': 'Photo Portfolio - Image gallery with zoom and grid controls',
  'ip': 'IP Information Dashboard - Network and browser fingerprinting info',
  'ip2': 'Network Information - IPv4/IPv6 address details',
  'lfss': 'Lightning Fast Scripture Search - High-performance scripture search engine',
  'matrix': 'Matrix Rain - Animated falling character effect',
  'one': 'Ministering Memory Helper - LDS ministering assignment tracker',
  'psa': 'PTSD Symptom Awareness Tool - VA disability rating calculator',
  'pw': 'Password Strength Checker - Password security analyzer',
  'ql': 'Local To-Do List - Simple task management with local storage',
  'qr': 'QR Code Generator - Custom QR code creation and download',
  'rand': 'Random Generator - Random numbers, passwords, and passphrases',
  'rng': 'Random Password Generator - Secure password creation',
  'run': 'Jumpy Man - Chill 2D platformer with wall-smashing and turbo mode',
  'sb': 'Dynamic Soundboard - PHP-powered audio clip player',
  'sh': 'Scripture Highlighter - LDS scripture reader with highlighting',
  'sm': 'Scripture Matrix - Matrix animation with scripture verses from multiple books',
  'sm/b': 'Bible Matrix - Matrix animation with King James Version verses',
  'sm/bom': 'Book of Mormon Matrix - Matrix animation with Book of Mormon verses',
  'sm/pogp': 'Pearl of Great Price Matrix - Matrix animation with Pearl of Great Price verses',
  'sm/dc': 'Doctrine & Covenants Matrix - Matrix animation with Doctrine and Covenants verses',
  'stopwatch': 'Stopwatch - Polished timing application',
  'tarot': 'Tarot Card Reader - Mystical card reading application',
  'tt': 'tTracker - Tinnitus episode logger',
  'wc': 'Text Statistics - Text analysis and counting tool',
  'write': 'just write - Minimalist note-taking application',
  'zenw': 'Zen Writer - Distraction-free text editor',
  'zonk': 'VA Disability Claim Guide - Veteran benefits resource'
};

// Tool categories for sorting by kind
const toolCategories = {
  '23': 'religious',
  'bom': 'religious',
  'bomr': 'religious',
  'buddy': 'medical',
  'cal': 'productivity',
  'click': 'music',
  'color': 'design',
  'colors': 'design',
  'countdown': 'productivity',
  'dice': 'gaming',
  'foto': 'design',
  'ip': 'networking',
  'ip2': 'networking',
  'lfss': 'religious',
  'matrix': 'entertainment',
  'one': 'religious',
  'psa': 'medical',
  'pw': 'security',
  'ql': 'productivity',
  'qr': 'productivity',
  'rand': 'productivity',
  'rng': 'security',
  'run': 'gaming',
  'sb': 'entertainment',
  'sh': 'religious',
  'sm': 'religious',
  'sm/b': 'religious',
  'sm/bom': 'religious',
  'sm/pogp': 'religious',
  'sm/dc': 'religious',
  'stopwatch': 'productivity',
  'tarot': 'entertainment',
  'tt': 'medical',
  'wc': 'productivity',
  'write': 'productivity',
  'zenw': 'productivity',
  'zonk': 'medical'
};

// Directories to exclude from tool detection
const excludeDirs = ['bc', 'bg', 'cash', 'degrees', 'eb', 'oldbuddy', 'split', 'ss', 'ssah', 'stuff', 'textfiles', 'tmp', 'tools', 'url', 'work', 'zsr', 'alpha', 'beta', 'node_modules', '.git', '.github', 'meh'];

function getDirectories(source) {
  return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(dir => !excludeDirs.includes(dir) && !dir.startsWith('.'))
    .filter(dir => {
      const dirPath = path.join(source, dir);
      // Check for index.html
      if (fs.existsSync(path.join(dirPath, 'index.html'))) {
        return true;
      }
      // Check for index.php (for PHP tools like soundboard)
      if (fs.existsSync(path.join(dirPath, 'index.php'))) {
        return true;
      }
      // Check for public/index.html (for Node.js tools like degrees)
      if (fs.existsSync(path.join(dirPath, 'public', 'index.html'))) {
        return true;
      }
      // Check for any .html file
      try {
        const files = fs.readdirSync(dirPath);
        return files.some(file => file.endsWith('.html'));
      } catch (e) {
        return false;
      }
    });
}

function generateToolsMd(dirs) {
  let content = '# Web Tools Cheat Sheet\n\n';
  content += 'This document provides a comprehensive overview of all the web-based tools and applications in this codebase.\n\n';
  content += '## Tools\n\n';

  dirs.forEach(dir => {
    const description = toolDescriptions[dir] || dir + ' - Tool description needed';
    content += `- **${description.split(' - ')[0]}** (${dir}/): ${description.split(' - ')[1] || 'Description pending'}\n\n`;
  });

  content += '## Other Directories\n\n';
  content += '- **stuff/**: Storage directory for PDFs, ROMs, and text files\n';
  content += '- **textfiles/**: Repository of important open-source documents\n';
  content += '- **tools/**: Dashboard-style navigation page\n';
  content += '- **tmp/**: Temporary directory\n';
  content += '- **work/**: Work-in-progress files\n\n';
  content += '*Last updated: ' + new Date().toISOString().split('T')[0] + '*\n';

  return content;
}

function generateStyles() {
  return `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    margin: 0;
    padding: 20px;
    background:
        linear-gradient(rgba(85,107,47,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(85,107,47,0.03) 1px, transparent 1px),
        #f9faf7;
    background-size: 20px 20px;
    color: #2c3e50;
}
.container {
    max-width: 1000px;
    margin: 0 auto;
}
h1 {
    color: #556B2F;
    text-align: center;
    margin-bottom: 10px;
    font-weight: 300;
}
.logo {
    text-align: center;
    font-size: 48px;
    font-weight: bold;
    color: #003366;
    font-family: 'Courier New', monospace;
    margin-bottom: 20px;
    text-shadow: 0 0 10px rgba(85,107,47,0.3);
}
.subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 30px;
    font-size: 1.1em;
    font-weight: 400;
}
.search-container {
    margin-bottom: 20px;
    text-align: center;
}
.search-input {
    width: 100%;
    max-width: 400px;
    padding: 12px 20px;
    font-size: 16px;
    border: 2px solid #e1e8ed;
    border-radius: 25px;
    outline: none;
    transition: border-color 0.3s;
}
.search-input:focus {
    border-color: #3498db;
}
.sort-container {
    margin-bottom: 20px;
    text-align: center;
}
.sort-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
}
.sort-btn {
    padding: 8px 16px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    background-color: #f9fafb;
    color: #374151;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.sort-btn:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
}
.sort-btn.active {
    background-color: #3498db;
    color: white;
    border-color: #3498db;
}
.tools-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto 40px auto;
}
.tool-row {
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 12px;
    padding: 20px 20px 14px 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
    border: 1px solid #e1e8ed;
    text-decoration: none;
    color: inherit;
    height: 100%;
}
.tool-row:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    transform: translateY(-2px);
    text-decoration: none;
    color: inherit;
}
.tool-row.focused {
    outline: 3px solid #3498db;
    outline-offset: 2px;
    box-shadow: 0 8px 24px rgba(52,152,219,0.3);
}
.tool-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}
.tool-header {
    margin-bottom: 12px;
}
.tool-path {
    font-size: 13px;
    color: #666;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-weight: 500;
    margin-bottom: 8px;
}
.tool-title {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 8px 0;
    line-height: 1.3;
}
.tool-description {
    color: #666;
    line-height: 1.5;
    font-size: 14px;
    margin: 0;
    flex: 1;
}
.no-results {
    text-align: center;
    padding: 40px;
    color: #666;
    font-style: italic;
}
.tool-count {
    text-align: center;
    color: #888;
    font-size: 0.85em;
    margin-bottom: 20px;
}
.keyboard-nav {
    text-align: center;
    margin-top: 60px;
    color: #666;
    font-size: 0.85em;
    line-height: 1.6;
}
.keyboard-nav kbd {
    background: #f1f3f4;
    border: 1px solid #ccc;
    border-radius: 3px;
    box-shadow: 0 1px 0 rgba(0,0,0,0.2);
    color: #444;
    display: inline-block;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 0.8em;
    font-weight: bold;
    line-height: 1;
    padding: 2px 4px;
    white-space: nowrap;
}
.copyright {
    text-align: center;
    margin-top: 20px;
    color: #888;
    font-size: 0.75em;
}
.last-updated {
    text-align: center;
    margin-top: 40px;
    color: #888;
    font-size: 0.8em;
}
@media (max-width: 768px) {
    .tools-list {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
    }
    .tool-row {
        padding: 16px 16px 12px 16px;
    }
    .tool-title {
        font-size: 15px;
    }
    .tool-description {
        font-size: 13px;
    }
}
@media (max-width: 480px) {
    .tools-list {
        grid-template-columns: 1fr;
        gap: 12px;
    }
    .tool-row {
        padding: 16px 16px 12px 16px;
    }
}`;
}

function generateScript() {
  return `const searchInput = document.getElementById('searchInput');
const toolsList = document.getElementById('toolsList');
const sortButtons = document.querySelectorAll('.sort-btn');
let currentSort = 'default';
let focusedToolIndex = -1;

function sortTools(sortType) {
    const rows = Array.from(toolsList.querySelectorAll('.tool-row'));
    sortButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-sort="' + sortType + '"]').classList.add('active');

    rows.sort((a, b) => {
        switch (sortType) {
            case 'title':
                return a.dataset.title.localeCompare(b.dataset.title);
            case 'kind':
                return a.dataset.kind.localeCompare(b.dataset.kind);
            default:
                return parseInt(a.dataset.index) - parseInt(b.dataset.index);
        }
    });

    rows.forEach(row => toolsList.appendChild(row));
    // Reset focus after sorting
    focusedToolIndex = -1;
    updateToolFocus();
}

function filterTools() {
    const query = searchInput.value.toLowerCase();
    const rows = toolsList.querySelectorAll('.tool-row');
    let hasVisible = false;
    rows.forEach(row => {
        const title = row.dataset.title;
        const desc = row.dataset.description;
        const path = row.dataset.path;
        const visible = title.includes(query) || desc.includes(query) || path.includes(query);
        row.style.display = visible ? 'flex' : 'none';
        if (visible) hasVisible = true;
    });
    const noResults = document.querySelector('.no-results');
    if (noResults) noResults.remove();
    if (!hasVisible && query) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.textContent = 'No tools match your search.';
        toolsList.appendChild(noResultsDiv);
    }
    // Reset focus after filtering
    focusedToolIndex = -1;
    updateToolFocus();
}

function getVisibleTools() {
    return Array.from(toolsList.querySelectorAll('.tool-row')).filter(row =>
        row.style.display !== 'none'
    );
}

function updateToolFocus() {
    const visibleTools = getVisibleTools();
    visibleTools.forEach((tool, index) => {
        tool.classList.toggle('focused', index === focusedToolIndex);
    });
}

function navigateTools(direction) {
    const visibleTools = getVisibleTools();
    if (visibleTools.length === 0) return;

    const gridColumns = window.getComputedStyle(toolsList).gridTemplateColumns.split(' ').length;

    switch (direction) {
        case 'left':
            focusedToolIndex = Math.max(0, focusedToolIndex - 1);
            break;
        case 'right':
            focusedToolIndex = Math.min(visibleTools.length - 1, focusedToolIndex + 1);
            break;
        case 'up':
            focusedToolIndex = Math.max(0, focusedToolIndex - gridColumns);
            break;
        case 'down':
            focusedToolIndex = Math.min(visibleTools.length - 1, focusedToolIndex + gridColumns);
            break;
    }

    updateToolFocus();

    // Scroll focused tool into view
    if (focusedToolIndex >= 0 && visibleTools[focusedToolIndex]) {
        visibleTools[focusedToolIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
    }
}

function handleKeyDown(event) {
    // If search is focused, only handle Escape
    if (document.activeElement === searchInput) {
        if (event.key === 'Escape') {
            searchInput.blur();
            event.preventDefault();
        }
        return;
    }

    // Handle search focus
    if (event.key === '/') {
        searchInput.focus();
        event.preventDefault();
        return;
    }

    // Handle tool navigation
    switch (event.key) {
        case 'h':
        case 'ArrowLeft':
            navigateTools('left');
            event.preventDefault();
            break;
        case 'j':
        case 'ArrowDown':
            navigateTools('down');
            event.preventDefault();
            break;
        case 'k':
        case 'ArrowUp':
            navigateTools('up');
            event.preventDefault();
            break;
        case 'l':
        case 'ArrowRight':
            navigateTools('right');
            event.preventDefault();
            break;
        case 'Enter':
            const visibleTools = getVisibleTools();
            if (focusedToolIndex >= 0 && visibleTools[focusedToolIndex]) {
                visibleTools[focusedToolIndex].click();
            }
            event.preventDefault();
            break;
    }
}

searchInput.addEventListener('input', filterTools);
sortButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentSort = button.dataset.sort;
        sortTools(currentSort);
    });
});

// Add keyboard navigation
document.addEventListener('keydown', handleKeyDown);

// Focus search input on page load
searchInput.focus();`;
}

function generateIndexHtml(dirs) {
  let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>njsr.org</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="logo">njsr.org</div>
        <p class="subtitle">Privacy-first web tools</p>

        <div class="search-container">
            <input type="text" class="search-input" placeholder="Search tools..." id="searchInput">
        </div>

        <div class="sort-container">
            <div class="sort-buttons">
                <button class="sort-btn active" data-sort="default">Default</button>
                <button class="sort-btn" data-sort="kind">By Kind</button>
                <button class="sort-btn" data-sort="title">By Title</button>
            </div>
        </div>

        <p class="tool-count">${dirs.length} tools</p>

        <div class="tools-list" id="toolsList">
`;

  dirs.forEach((dir, index) => {
    const description = toolDescriptions[dir] || dir + ' - Tool description needed';
    const [title, desc] = description.split(' - ');
    const kind = toolCategories[dir] || 'other';
    content += `            <a href="/${dir}/" class="tool-row" data-title="${title.toLowerCase()}" data-description="${(desc || '').toLowerCase()}" data-kind="${kind}" data-path="${dir}" data-index="${index}">
                <div class="tool-content">
                    <div class="tool-header">
                        <div class="tool-path">${dir}/</div>
                        <div class="tool-title">${title}</div>
                    </div>
                    <div class="tool-description">${desc || 'Description pending'}</div>
                </div>
            </a>
`;
  });

  content += `        </div>
        <div class="keyboard-nav">
            <strong>Keyboard Navigation:</strong>
            <kbd>/</kbd> search • <kbd>h/j/k/l</kbd> or arrows to navigate • <kbd>Enter</kbd> to select • <kbd>Esc</kbd> exit search
        </div>
        <div class="copyright">
            © 2002-2026 njsr.org • MIT License
        </div>
        <div class="last-updated">Last updated: ${new Date().toISOString().split('T')[0]}</div>
    </div>
    <script src="script.js"></script>
</body>
</html>`;

  return content;
}

// Main execution
let dirs = getDirectories(rootDir).sort();

// Include sub-tools for sm/
if (dirs.includes('sm')) {
  const smSubdirs = getDirectories(path.join(rootDir, 'sm')).map(sub => 'sm/' + sub);
  dirs = dirs.concat(smSubdirs).sort();
}

fs.writeFileSync(toolsMdPath, generateToolsMd(dirs));
fs.writeFileSync(indexHtmlPath, generateIndexHtml(dirs));
fs.writeFileSync(stylesCssPath, generateStyles());
fs.writeFileSync(scriptJsPath, generateScript());

// Clean up old alpha/beta directories if they exist and are empty
const alphaDir = path.join(rootDir, 'alpha');
const betaDir = path.join(rootDir, 'beta');

function removeIfEmpty(dir) {
  if (fs.existsSync(dir)) {
    const contents = fs.readdirSync(dir);
    // Only index.html means it's the old auto-generated page
    if (contents.length === 0 || (contents.length === 1 && contents[0] === 'index.html')) {
      if (contents.includes('index.html')) {
        fs.unlinkSync(path.join(dir, 'index.html'));
      }
      fs.rmdirSync(dir);
      console.log(`🗑️  Removed old ${path.basename(dir)}/ directory`);
    }
  }
}

removeIfEmpty(alphaDir);
removeIfEmpty(betaDir);

console.log('✅ Tools documentation updated!');
console.log(`📝 tools.md: ${dirs.length} tools documented`);
console.log(`🌐 index.html: Main page generated`);
console.log(`🎨 styles.css: Styles generated`);
console.log(`⚙️  script.js: Script generated`);
