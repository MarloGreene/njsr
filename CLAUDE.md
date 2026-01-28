# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

njsr.org is a collection of 40+ privacy-first, vanilla JavaScript web tools. Each tool runs entirely client-side with data stored in localStorage.

**Core Principles:**
- No frameworks (React, Vue, Angular) for standard tools
- No build process or external dependencies
- All data stays local in browser localStorage
- Offline-capable after initial load

## Commands

| Command | Purpose |
|---------|---------|
| `python -m http.server 8000` | Local development server |
| `node update-tools.js` | Generate `tools.md` and `index.html` |

### /degrees backend only
```bash
cd degrees && npm install
npm run setup    # Import data and precompute Kevin Bacon paths
npm start        # Start Express server
npm run dev      # Start with file watching
```

## Architecture

```
njsr/
├── index.html              # Landing page with searchable tool list
├── tools.md                # Auto-generated tool list (markdown)
├── update-tools.js         # Documentation generator
├── [tool-name]/            # Each tool in its own folder
│   ├── index.html          # Main entry point
│   ├── script.js           # Optional separate JS
│   ├── style.css           # Optional separate CSS
│   └── README.md           # Tool documentation
├── degrees/                # Special: Node.js + Express + SQLite backend
│   ├── public/             # Frontend files
│   ├── server/             # Express server
│   └── package.json
└── sb/                     # Special: PHP backend for audio serving
    └── index.php
```

## Version Control

This project uses **git** for version control:
- Use meaningful commit messages
- Tag releases for stable versions (e.g., `git tag v1.0-toolname`)
- Use branches for experimental features

## Adding/Modifying Tools

1. Create `/tool-name/` with `index.html` and optionally `README.md`
2. Add tool description and category to `update-tools.js`
3. Run `node update-tools.js` to update docs
4. Commit changes with git

## Code Patterns

**JavaScript (ES6+, vanilla):**
- Use `const`/`let`, template literals, event listeners
- Initialize with `document.addEventListener('DOMContentLoaded', () => init())`
- Use `textContent` instead of `innerHTML` for user data (XSS prevention)
- Persist data with `localStorage.setItem(key, JSON.stringify(value))`
- Validate inputs: check type, length, use try/catch for JSON.parse()

**CSS:**
- Mobile-first with CSS custom properties for theming
- Breakpoints: 600px (mobile), 768px (tablet), 1024px (desktop)
- Prefer flexbox/grid over floats

**HTML:**
- Semantic HTML5 with viewport meta tag
- No inline event handlers (use addEventListener)

## What Not To Do

- Don't add frameworks, build tools, or npm dependencies to standard tools
- Don't add tracking, analytics, or external API calls (except /degrees which uses TMDB)
- Don't use innerHTML with user data
- Don't duplicate existing tools without significant improvement

## Testing

Manual browser testing only (Chrome, Firefox, Safari, Edge, mobile). Check localStorage persistence and import/export features across browser restarts.
