# LDS Scripture Search & Highlighter v2

A comprehensive, privacy-focused web application for searching, filtering, and highlighting the LDS Standard Works. This powerful tool combines advanced search capabilities with interactive highlighting features, built entirely with vanilla HTML, CSS, and JavaScript for maximum privacy and performance.

## ✨ Features

### 🔍 **Advanced Search & Filtering**
- **Full-Text Search**: Lightning-fast search across all 42,000+ verses
- **Volume Filters**: Bible, Book of Mormon, Doctrine & Covenants, Pearl of Great Price
- **Search Options**: Case-sensitive search, whole word matching, max results control
- **Navigation Filters**: Filter by specific volume, book, chapter, or verse
- **Real-Time Results**: Instant search with live result counts and match highlighting

### 🎨 **Interactive Highlighting System**
- **Verse Highlighting**: Click any verse to highlight with color cycling
- **Phrase Highlighting**: Drag-select text for precise phrase highlighting
- **Color Palette**: 4 customizable highlight colors (green, yellow, pink, purple)
- **Advanced Highlighting**: Highlight next match, all matches on page, or all matches found
- **Persistent Storage**: All highlights saved locally using localStorage

### 📖 **Reading & Navigation**
- **Two-Column Layout**: Adjustable columns (1-6) for optimal reading
- **Font Size Control**: Adjustable font size (12px-24px) for comfortable reading
- **Pagination**: Navigate through results with previous/next page controls
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Keyboard Navigation**: Arrow keys and keyboard shortcuts for power users

### 💾 **Data Management**
- **Export Highlights**: Save highlight sets as JSON files
- **Import Highlights**: Restore previously exported highlight sets
- **Settings Persistence**: Font size, column count, and preferences saved locally
- **Privacy-First**: No server-side tracking or data collection

## 🚀 Quick Start

1. **Clone or Download**: Get the project files
2. **Start Local Server**:
   ```bash
   python3 -m http.server 8080
   ```
3. **Open in Browser**: Navigate to `http://localhost:8080/index.html`
4. **Start Exploring**: Search scriptures and begin highlighting!

## 📋 How to Use

### Basic Search
1. Enter search terms in the search box
2. Select volumes to search (Bible, Book of Mormon, D&C, Pearl of Great Price)
3. Choose search options (case sensitivity, whole words, max results)
4. Click "Search" or press Enter for instant results

### Advanced Filtering
- Use the navigation dropdowns to filter by volume, book, chapter, or verse
- Combine search filters with navigation filters for precise results
- Dynamic chapter/verse options populate based on selected book

### Highlighting Scriptures
- **Verse Highlighting**: Click any verse to highlight it
- **Color Cycling**: Click highlighted verses to cycle through colors
- **Phrase Highlighting**: Drag-select text for word/phrase highlighting
- **Advanced Options**:
  - "Highlight Next": Jump to and highlight the next search match
  - "Highlight All on Page": Highlight all search terms in current view
  - "Highlight All Matches": Highlight all instances across all results

### Customization
- **Font Size**: Use +/- buttons to adjust text size (12px-24px)
- **Column Count**: Adjust display columns (1-6) for your reading preference
- **Color Palette**: Click palette colors to select active highlight color

### Data Management
- **Export**: Save your highlights and settings as a JSON file
- **Import**: Restore highlights from a previously exported file
- **Local Storage**: All data persists between sessions automatically

## 🏗️ Architecture

### File Structure
```
/
├── index.html          # Main application interface
├── index.css           # Comprehensive styling and responsive design
├── index.js            # Core application logic and event handling
├── lds-scriptures.txt  # Complete LDS Standard Works text data
├── README.md           # This documentation
├── ROADMAP.md          # Future development plans
├── info.md             # Project notes and technical details
├── highlighter.html    # Original highlighter interface (reference)
├── scripture-search.html # Original search interface (reference)
├── scripture-search.js # Original search logic (reference)
├── scripture-search.css # Original search styles (reference)
├── styles.css          # Original highlighter styles (reference)
└── app.js              # Original highlighter logic (reference)
```

### Technical Stack
- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript
- **Data Storage**: Browser localStorage API
- **Styling**: Flexbox, CSS Grid, responsive design
- **Performance**: Pagination, efficient DOM manipulation, debounced search

### Key Components
- **Search Engine**: Regex-based full-text search with filtering
- **Highlight System**: CSS class-based highlighting with persistence
- **Pagination System**: Efficient rendering of large datasets
- **Settings Manager**: localStorage-based configuration persistence
- **UI Controls**: Responsive controls for font, columns, and navigation

## 🔧 Advanced Configuration

### Verses Per Page
Modify `this.versesPerPage` in `index.js` to change pagination size (default: 100)

### Highlight Colors
Customize the color palette in `this.settings.highlightColors` array

### Keyboard Shortcuts
- `←/→` or `A/D`: Navigate pages
- `↑/↓`: Scroll content
- `Enter`: Execute search

## 📊 Performance

- **Search Speed**: Sub-millisecond searches across 42,000+ verses
- **Memory Usage**: Efficient pagination prevents DOM bloat
- **Storage**: Compressed JSON storage for highlights and settings
- **Responsiveness**: Optimized for devices from mobile to desktop

## 🔒 Privacy & Security

- **Zero Tracking**: No analytics, telemetry, or server communication
- **Local Processing**: All search and highlighting happens client-side
- **Data Ownership**: Complete control over your highlight data
- **No Dependencies**: Pure vanilla JavaScript, no external libraries

## 🛠️ Development

### Prerequisites
- Modern web browser with ES6+ support
- Local HTTP server (Python, Node.js, or any static server)
- Text editor for code modifications

### Building & Testing
1. Start local server in project directory
2. Open `index.html` in browser
3. Use browser dev tools for debugging
4. Test across different devices and screen sizes

### Code Structure
- **Class-Based Architecture**: `ScriptureSearchHighlighter` class
- **Modular Methods**: Separate concerns for search, display, persistence
- **Event-Driven**: Clean event listener management
- **Error Handling**: Graceful fallbacks for edge cases

## 📈 Roadmap

See `ROADMAP.md` for planned features including:
- Enhanced export formats (PDF, Markdown)
- Cloud sync capabilities
- Advanced study tools
- Theme customization
- Mobile app versions

## 🤝 Contributing

This is a personal project, but contributions are welcome:
- Bug reports and feature requests
- Code improvements and optimizations
- Documentation enhancements
- UI/UX suggestions

## 📄 License

Open source - use and modify as needed for personal scripture study.

## 🙏 Acknowledgments

Built with love for the study of sacred texts. Special thanks to the original LDS Scripture Highlighter and Lightning Fast Scripture Search projects that inspired this comprehensive tool.

---

**Version 2.0** - Combining the best of search and highlighting in one powerful application.