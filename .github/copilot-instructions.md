# Copilot Instructions for njsr.org Web Tools

## Big Picture Architecture
- **Portfolio Structure**: 40+ independent web tools, each in its own folder. Tools are categorized into productivity, religious, design, security, medical, networking, entertainment, music, and gaming.
- **Standard Tools**: Pure HTML/CSS/JavaScript, no build process, no dependencies, all client-side logic. Data is stored in browser localStorage. Tools are offline-capable after initial load.
- **Special Tools**:
  - `/sb`: PHP backend for audio file serving, requires PHP-enabled web server.
- **Documentation Generator**: `update-tools.js` (Node.js script) auto-generates `tools.md`, and `tools/index.html` (searchable dashboard). Run `node update-tools.js` to update after adding/modifying tools.
- **Landing Page**: `index.html` displays a searchable grid of all tools with descriptions and categories.

## Developer Workflows
- **Quick Start**: Open any tool's `index.html` in a browser, or serve locally with `python3 -m http.server 8080`.
- **Static Hosting**: Most tools deploy to GitHub Pages, Netlify, Vercel, or any static host. No build step required.
- **Backend Tools**: For `/sb`, deploy to PHP server.
- **Testing**: Manual browser testing. Use browser dev tools for debugging. Check console for errors, test localStorage persistence, import/export features. Cross-browser compatibility (Chrome, Firefox, Safari, Edge).
- **Adding New Tools**: Create a new folder with `index.html`, optional `script.js`, `style.css`, and `README.md`. Add description and category to `update-tools.js` toolDescriptions and toolCategories, then run `node update-tools.js` to update docs.
- **Security**: All tools sanitize input, escape HTML, and avoid external API calls unless documented. See `SECURITY.md` for details.

## Project-Specific Conventions
- **Vanilla Only**: No frameworks (React, Vue, Angular), no build tools (Webpack, Babel), no external libraries except for special tools.
- **File Layout**: Each tool folder contains `index.html` (main entry), optional `script.js`, `style.css`, and `README.md`. Some tools have additional data files.
- **Code Style**: ES6+, camelCase for variables/functions, clear function names, comments for complex logic. Use `const`/`let`, template literals, and event listeners. No inline event handlers.
- **Persistence**: Use localStorage for state and data. Keys vary by tool (e.g., `scriptureHighlights` for sh, `countdownEvent` for countdown). No cookies, no accounts, no server-side storage.
- **UI Patterns**: Responsive design with media queries, keyboard navigation (Tab, Enter), semantic HTML, clear visual feedback. Highlighting, search, and export/import are common features.
- **Security Patterns**: Always use `textContent` (not `innerHTML`) for user data, validate file imports with size limits (10MB), enforce input length limits, whitelist color values (hex codes only).
- **Data Formats**: TXT files (tab-delimited for scriptures), JSON for import/export and data storage.

## Integration Points
- **External APIs**: None for standard tools. `/sb` serves local audio files.
- **Cross-Component Communication**: Direct DOM manipulation, global variables for state. No modules or package managers.
- **Tool Interlinking**: Some tools reference others (e.g., scripture tools), but no shared code.

## Key Files & Directories
- `/index.html`: Landing page with searchable tool grid.
- `/tools.md`, `/tools/index.html`: Auto-generated tool lists (run `node update-tools.js` to update).
- `/[tool]/index.html`: Main tool implementation.
- `/[tool]/script.js`, `/[tool]/style.css`, `/[tool]/README.md`: Tool code, styles, and docs.
- `/SECURITY.md`, `/CONTRIBUTING.md`: Security and contribution guidelines.
- `/stuff/`: Storage for PDFs, ROMs, text files.
- `/textfiles/`: Open-source document repository.
- `/update-tools.js`: Node.js script to scan tools and generate docs.

## Example Patterns
- **Highlighting**: Store highlights in localStorage as `{reference: {color, timestamp}}` (e.g., in `/sh`).
- **Search**: Realtime via `input` event, case-insensitive, filter entries containing query.
- **Export/Import**: JSON for highlights, settings, or data. Validate on import with `JSON.parse()` in try/catch, check structure.
- **Responsive Design**: Use CSS Grid/Flexbox, media queries for mobile (e.g., `@media (max-width: 600px)`).
- **Event Handling**: Add listeners in JS, e.g., `element.addEventListener('click', handler)`.
- **Initialization**: Use `document.addEventListener('DOMContentLoaded', () => init())`.

---
Update these instructions as new tools or features are added. For tool-specific conventions, see each tool's `README.md`.