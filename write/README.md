# just write.

> A beautiful, private journal for capturing your thoughts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen.svg)]()
[![Vanilla JS](https://img.shields.io/badge/vanilla-JS-yellow.svg)]()

**just write.** is a minimalist, feature-rich journaling web app that runs entirely in your browser. No servers, no accounts, no tracking - just you and your thoughts.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

## 🚀 Quick Start

### Option 1: Download and Open
1. Download this repository
2. Open `index.html` in any modern web browser
3. Start writing immediately!

### Option 2: Run with Local Server
```bash
# Python 3
python -m http.server 8765

# Python 2
python -m SimpleHTTPServer 8765

# Node.js (if you have http-server installed)
npx http-server -p 8765
```
Then visit `http://localhost:8765`

### Option 3: Deploy to GitHub Pages
1. Fork this repository
2. Go to Settings → Pages
3. Select your branch and save
4. Your journal will be live at `https://yourusername.github.io/write`

## ✨ Features

### Core Functionality
- **Instant Writing**: Focus immediately on the text input - no login, no setup
- **Auto-save**: Changes auto-save 1 second after you stop typing
- **Trash/Recycle Bin**: Deleted entries go to trash (no accidental permanent deletion)
  - One-click restore from trash
  - Permanent delete requires triple confirmation
  - Nuclear option to clear all data
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + Enter` to save entry
  - `Escape` to close modal
  - Native browser undo/redo (`Ctrl/Cmd + Z`)

### View Modes (4 Total)
1. **Sticky Notes** (Default) - Colorful grid of sticky notes with random rotations
2. **Pile View** - Realistic 3×5 index cards with ruled lines, pink header, rubber stamp dates, and highlighter color streaks
3. **List View** - Clean, traditional list format
4. **Compact View** - One-line entries for maximum density

### Color System (13 Colors)
**Bright Palette:**
- Red, Orange, Yellow, Green, Blue, Purple

**Soft/Heather Palette:**
- Soft Pink, Soft Peach, Soft Mint, Soft Lavender, Soft Gray, Soft Teal

**Additional:**
- None (no color)

### Sorting & Filtering
**Sort Options:**
- Newest first
- Oldest first
- Longest first
- Shortest first
- By color
- Shuffle (random)

**Search:**
- Real-time search filter
- Searches entry text and location data

### Data Management
**Storage:**
- localStorage for browser-based persistence
- No server required - completely private

**Export:**
- Export as TXT (formatted text file)
- Export as JSON (structured data)

**Import:**
- Import JSON files
- Duplicate detection prevents re-importing same entries

### Location Tracking
- **Opt-in only**: Location permission requested when user toggles it on
- Stores latitude/longitude coordinates
- Visual indicator when location is enabled
- Preference saved across sessions

### Zen Mode
- Full-screen dark writing environment
- Minimal distractions for focused writing
- Dark theme optimized for night writing
- Perfect for midnight ideas
- Georgia serif font for comfortable reading
- Toggle on/off from edit modal

### UI Features
- **Collapsible Controls**: Minimize header controls for maximum screen space
- **Header View Toggle**: Quick view switcher visible when controls collapsed
- **Entry Counter**: Badge showing total note count
- **Modal Editing**: Click any entry to edit in a modal
- **Delete Confirmation**: Preview text before deleting
- **Responsive Design**: Works on desktop and mobile

## 🎨 Design Philosophy
- Typewriter-style title with distressed effect
- Purple gradient background
- White card-based UI elements
- Smooth transitions and hover effects
- Accessibility-focused with clear visual hierarchy

## 🚀 Usage

### Getting Started
1. Open `index.html` in a web browser
2. Start typing immediately in the text area
3. Choose a color label (optional)
4. Press "Save Entry" or use `Ctrl/Cmd + Enter`
5. Your entry appears below!

### Tips & Tricks
- **Quick Save**: `Ctrl/Cmd + Enter` from the input field
- **Edit Entries**: Click any entry in sticky/compact view to open the editor
- **Zen Mode**: Click the 🧘 button in the edit modal for distraction-free writing
- **Minimize Controls**: Click "Collapse" to maximize screen space for reading
- **View Toggle**: When collapsed, use the header button to switch views quickly
- **Search**: Use the search bar to filter entries by text or location
- **Export Regularly**: Download your entries as JSON for backup

## 📁 File Structure
```
write/
├── index.html          # Main HTML structure
├── style.css           # All styling and view modes
├── script.js           # Application logic
├── sample-entries.json # Sample data for testing
└── README.md           # This file
```

## 🔧 Technical Details

### State Management
- 9 state variables tracked in localStorage
- View mode, location preference, minimize state all persisted
- Entries stored as JSON array

### Performance
- Debounced auto-save (1 second for text, 0.5s for colors)
- Event delegation for efficient event handling
- Minimal DOM manipulation
- Max entry size: 50,000 characters
- Max storage: ~5MB (browser localStorage limit)

### Security
- XSS protection via HTML escaping on all user input
- Content Security Policy (CSP) headers
- Color value validation (whitelist)
- Import file size limits (10MB max)
- Input sanitization and length limits
- localStorage quota management

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Uses ES6+ JavaScript features
- Geolocation API for optional location tracking
- FileReader API for JSON import
- localStorage API for data persistence

## 🔒 Privacy & Security

**100% Private:**
- All data stored locally in your browser
- No external servers, APIs, or tracking
- No cookies, no analytics, no telemetry
- Your data never leaves your device

**Data Control:**
- Export your data anytime (JSON or TXT)
- Import/backup with duplicate detection
- Clear data by clearing browser storage
- No vendor lock-in

## ⚙️ Configuration

The app works out of the box with no configuration needed. All preferences are saved automatically:
- View mode preference
- Location tracking preference  
- Minimize/expand state
- Entry sorting order (until page refresh)

## 🐛 Troubleshooting

**My entries disappeared!**
- Check if you're using the same browser
- localStorage is per-origin (protocol + domain + port)
- Try exporting before clearing browser data

**Storage quota exceeded!**
- Export old entries and delete them
- Browser localStorage typically limited to 5-10MB

**Import not working!**
- Ensure JSON file is valid format
- Check file size (max 10MB)
- Max 10,000 entries per import

**Location not working!**
- Click the "📍 Location Off" button to enable
- Grant browser permission when prompted
- Location shows as coordinates (not address)

## 🎯 Future Enhancements (v2.0 Ideas)
- Tags/categories
- Rich text formatting
- Image attachments
- Cloud sync option
- Dark mode for main interface
- Multiple journals
- Export to Markdown
- Calendar view
- Word count tracking
- Backup reminders

## 📝 Version History

### v1.0.0 (January 2026)
- Initial release
- 4 view modes (sticky, pile, list, compact)
- 13 color options (6 bright + 6 soft + none)
- Zen mode for focused, distraction-free writing
- Auto-save functionality with debouncing
- Full search and sort capabilities (6 modes)
- Optional location tracking (opt-in)
- Export/import functionality (JSON & TXT)
- Security hardening (XSS protection, input validation)
- Responsive design for desktop and mobile

## 🤝 Contributing

Contributions are welcome! This is a simple vanilla JS project with no build process.

**To contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

**Guidelines:**
- Keep it vanilla (no frameworks or build tools)
- Maintain the minimalist aesthetic
- Add comments for complex logic
- Test on Chrome, Firefox, and Safari
- Preserve privacy (no external calls)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

## 🙏 Acknowledgments

- Inspired by the need for a simple, private journaling tool
- Built with vanilla JavaScript - no dependencies!
- Typewriter font aesthetic for the title
- 3×5 index card design inspiration

## 📧 Support

Found a bug? Have a suggestion? 
- Open an issue on GitHub
- Or fork and submit a pull request!

---

**just write.** - Because sometimes you just need to capture your thoughts, beautifully. ✨
