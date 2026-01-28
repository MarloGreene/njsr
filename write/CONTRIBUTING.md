# Contributing to just write.

First off, thank you for considering contributing to **just write.**! It's people like you that make this tool better for everyone.

## Code of Conduct

This project values simplicity, privacy, and respect. We expect all contributors to:
- Be respectful and inclusive
- Keep discussions focused and constructive
- Respect different viewpoints and experiences
- Accept constructive criticism gracefully

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs what actually happened
- **Screenshots** if applicable
- **Browser and version** (Chrome 120, Firefox 121, etc.)
- **Operating system** (macOS, Windows, Linux)

### Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature already exists or has been suggested
- Explain the use case and why it would benefit users
- Keep suggestions aligned with the minimalist philosophy
- Consider privacy implications (no external services)

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following the guidelines below
3. **Test thoroughly** in at least 2 different browsers
4. **Update documentation** if you changed functionality
5. **Write clear commit messages** describing what and why

## Development Guidelines

### Keep It Vanilla

This project intentionally uses **no frameworks, no build tools, no dependencies**. Please maintain this philosophy:

- ✅ Vanilla JavaScript (ES6+)
- ✅ Plain CSS (no preprocessors)
- ✅ Simple HTML
- ❌ No React, Vue, Angular, etc.
- ❌ No TypeScript, Babel, Webpack, etc.
- ❌ No CSS frameworks (Bootstrap, Tailwind, etc.)
- ❌ No external libraries or CDN dependencies

### Code Style

**JavaScript:**
```javascript
// Use clear, descriptive function names
function saveEntryToLocalStorage() { }

// Comment complex logic
// Calculate days since entry for relative date display
const daysSince = Math.floor(diff / (1000 * 60 * 60 * 24));

// Use const/let, not var
const entries = [];
let currentView = 'sticky';

// Use template literals for readability
const html = `<div class="entry">${escapeHtml(text)}</div>`;
```

**CSS:**
```css
/* Group related styles */
/* Header styles */
.header { }
.header-top { }
.header-right { }

/* Use semantic naming */
.entry-card { }
.color-picker { }
.zen-mode { }

/* Comment non-obvious CSS */
/* Prevent text selection during drag operations */
user-select: none;
```

**HTML:**
```html
<!-- Use semantic HTML -->
<header>
<main>
<button>

<!-- Descriptive IDs and classes -->
<div id="entriesContainer" class="entries-container">

<!-- Accessibility attributes -->
<button aria-label="Delete entry" title="Delete entry">
```

### Security Requirements

All contributions must maintain security standards:

- **Always escape user input** before rendering as HTML
- **Validate all external data** (imports, location data)
- **Use whitelist validation** for constrained values (colors)
- **Implement size limits** on inputs and imports
- **Test for XSS vulnerabilities** in your changes
- **No inline event handlers in generated HTML** (use addEventListener)

### Testing Checklist

Before submitting a PR, verify:

- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Safari (latest)
- [ ] No console errors or warnings
- [ ] localStorage persistence works
- [ ] Export/import functionality unaffected
- [ ] Mobile responsive (if UI changes)
- [ ] No XSS vulnerabilities introduced
- [ ] Keyboard shortcuts still work
- [ ] Auto-save functions correctly

### Privacy & Data

This app is **100% private**. Never add:
- Analytics or tracking (Google Analytics, etc.)
- External API calls
- Cloud storage without explicit opt-in
- Cookies (except localStorage)
- Telemetry or crash reporting
- Social media integrations

### Documentation

If your change affects user-facing features:
- Update README.md with new features
- Add entry to CHANGELOG.md
- Update inline code comments
- Consider adding to the troubleshooting section

## Project Structure

```
write/
├── index.html          # Main HTML structure (140 lines)
├── style.css           # All styling (~950 lines)
├── script.js           # Application logic (~800 lines)
├── README.md           # User documentation
├── LICENSE             # MIT License
├── CHANGELOG.md        # Version history
├── CONTRIBUTING.md     # This file
└── sample-entries.json # Test data
```

### Key Functions to Know

**script.js structure:**
- `saveEntry()` - Main entry creation
- `renderEntries()` - Display entries in current view
- `toggleView()` - Cycle through view modes
- `openEntryModal()` - Edit modal management
- `escapeHtml()` - XSS protection
- `sanitizeEntry()` - Input validation
- `exportAsJSON()` / `importJSON()` - Data portability

### CSS Architecture

- Root variables for theming (`:root`)
- View-specific styles (`.pile-view`, `.sticky-view`, etc.)
- Component styles (`.entry-card`, `.modal`, etc.)
- Responsive breakpoints for mobile

## Questions?

Feel free to open an issue for discussion before working on major changes. We're happy to provide guidance!

## Recognition

Contributors will be acknowledged in the README and in release notes.

---

Thank you for helping make **just write.** better! ✨
