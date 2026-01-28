# Contributing to njsr.org Web Tools

Thank you for your interest in contributing! This project welcomes improvements, bug fixes, and new tools that align with our philosophy.

## Philosophy

Before contributing, understand our core principles:

1. **Privacy First**: No tracking, analytics, or data collection
2. **Vanilla JavaScript**: No frameworks or build tools (for standard tools)
3. **Single Purpose**: Each tool does one thing well
4. **Minimal Dependencies**: Prefer native browser APIs
5. **Offline Capable**: Tools should work without internet (after initial load)

## Getting Started

### Prerequisites
- Git
- A modern web browser
- Text editor or IDE
- Node.js (only for `/degrees` tool or running update scripts)
- PHP (only for `/sb` soundboard tool)

### Setup
```bash
git clone https://github.com/yourusername/njsr.git
cd njsr

# Most tools: just open in browser
open index.html

# Or run a local server
python -m http.server 8000
```

## Types of Contributions

### Bug Fixes
- Fix broken functionality
- Improve cross-browser compatibility
- Resolve security issues (see SECURITY.md)

### Enhancements
- Improve existing tool UX
- Add accessibility features
- Optimize performance
- Better mobile responsiveness

### New Tools
- Must follow the philosophy above
- Should be genuinely useful
- Must include a README.md

### Documentation
- Fix typos or unclear instructions
- Add missing tool documentation
- Improve code comments

## Contribution Process

### 1. Fork and Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes
- Follow the coding standards below
- Test in multiple browsers
- Update documentation if needed

### 3. Test Thoroughly
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome)

### 4. Commit
```bash
git add .
git commit -m "Add: brief description of change"
```

Commit message prefixes:
- `Add:` New feature or tool
- `Fix:` Bug fix
- `Update:` Enhancement to existing feature
- `Docs:` Documentation only
- `Refactor:` Code cleanup (no behavior change)

### 5. Submit Pull Request
- Describe what changed and why
- Reference any related issues
- Include screenshots for UI changes

## Coding Standards

### HTML
```html
<!-- Use semantic HTML5 -->
<main>
  <section>
    <h1>Tool Title</h1>
    <p>Description</p>
  </section>
</main>

<!-- Include viewport meta -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Keep it simple -->
<!-- Prefer single-file tools (HTML + embedded CSS/JS) for simple tools -->
```

### CSS
```css
/* Use CSS custom properties for theming */
:root {
  --primary-color: #007bff;
  --bg-color: #f8f9fa;
}

/* Mobile-first responsive design */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Prefer flexbox/grid over floats */
.layout {
  display: flex;
  gap: 1rem;
}
```

### JavaScript
```javascript
// Use ES6+ features
const tool = {
  init() {
    this.bindEvents();
    this.loadData();
  },

  // Sanitize all user input
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Use localStorage for persistence
  saveData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  // Validate inputs
  validateInput(value, maxLength = 10000) {
    if (typeof value !== 'string') return '';
    return value.slice(0, maxLength).trim();
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => tool.init());
```

### File Structure for New Tools
```
newtool/
├── index.html          # Main entry point
├── script.js           # JavaScript (if separate file needed)
├── style.css           # CSS (if separate file needed)
├── README.md           # Required documentation
└── data/               # Optional data files
    └── data.json
```

### README Template for New Tools
```markdown
# Tool Name

Brief description of what the tool does.

## Features
- Feature 1
- Feature 2

## Usage
1. Open index.html
2. Do the thing

## Privacy
- All data stored locally
- No external connections

## Technical Details
- Browser requirements
- Any special considerations

## License
MIT License
```

## What We Won't Accept

- **Tracking or Analytics**: No Google Analytics, no telemetry
- **Framework Dependencies**: No React, Vue, Angular for simple tools
- **Build Requirements**: No webpack, no npm for standard tools
- **External APIs**: Avoid unless essential and documented
- **Ads or Monetization**: This is a free, open project
- **Low-Quality Tools**: Must be genuinely useful
- **Duplicates**: Don't recreate existing tools without significant improvement

## Questions?

- Open an issue for general questions
- Check existing tool READMEs for patterns
- Review similar tools in the codebase

## Recognition

Contributors will be acknowledged in:
- Tool-specific README (for significant contributions)
- Release notes
- This file (for ongoing contributors)

---

Thank you for helping make njsr.org better!
