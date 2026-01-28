# LDS Scripture Highlighter

A privacy-focused, vanilla JavaScript web application for highlighting and studying the LDS Standard Works. Built with HTML, CSS, and JavaScript for maximum privacy and localStorage utilization.

## Features

- **Two-Column Book View**: Displays scriptures in a clean, readable two-column layout with minimal chapter and verse markings
- **Interactive Highlighting**: Click any verse to highlight it, with automatic color cycling through your palette
- **Drag-to-Select**: Select text with word boundary snapping for precise highlighting
- **Rainbow Cycle Mode**: Special mode for cycling through all available colors
- **Visual Feedback**: Animated blue glow indicator shows the active color when cycling
- **Persistent Storage**: All highlights saved locally using localStorage
- **Customizable Palette**: Configure any number of highlight colors
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

1. Clone or download this repository
2. Open a terminal in the project directory
3. Start a local HTTP server:
   ```bash
   python3 -m http.server 8080
   ```
4. Open your browser to `http://localhost:8080`
5. Start highlighting scriptures!

## How to Use

### Basic Highlighting
- **Click a verse**: Highlights the entire verse in the current palette color
- **Click again**: Cycles through available highlight colors
- **Drag to select**: Select specific text with automatic word boundary snapping

### Color Palette
- The color palette shows available highlight colors
- Colors cycle in the order they appear in the palette
- An animated blue glow briefly appears around the active color when cycling

### Special Modes
- **Rainbow Mode**: Cycles through all colors automatically (if implemented)


## File Structure

```
/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and animations
├── app.js              # Main application logic
├── lds-scriptures.txt  # LDS Standard Works text file
├── info.md             # Project notes and future plans
├── ROADMAP.md          # Feature roadmap
├── Screenshot.png      # Example UI screenshot (see below)
└── README.md           # This file
```

## Example Screenshot

![App Screenshot](Screenshot%202026-01-12%20at%204.50.27%E2%80%AFPM.png)



## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Flexbox layout, CSS animations
- **Vanilla JavaScript**: No frameworks, maximum privacy
- **localStorage**: Client-side data persistence


## Scripture Data Format

The scripture text file (`lds-scriptures.txt`) contains one verse per line in the format:
```
Book Chapter:Verse Text content here...
```

Example:
```
1 Nephi 1:1 I, Nephi, having been born of goodly parents...
```


## Planned Features

- Export/import highlight sets (markdown/HTML format)
- Configurable highlight sets with unique URLs for sharing
- Pre-built highlight sets for:
  - LDS Scripture Mastery
  - Gospel Principles
  - Names of the Lord
  - Words of Christ (red text)
  - Words of Mormon
  - And more...


## Privacy & Security

This application runs entirely in your browser with no server-side tracking or data collection. All highlights are stored locally using your browser's localStorage.


## Contributing

This is a personal project, but feel free to fork and modify for your own use. Pull requests for bug fixes or enhancements are welcome.


## License

This project is open source. Use at your own discretion.