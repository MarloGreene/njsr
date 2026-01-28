# Changelog

All notable changes to **just write.** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-12

### Added
- Initial release of just write.
- Four distinct view modes:
  - Sticky Notes view (default) with colorful grid layout
  - Pile view with realistic 3×5 index cards, ruled lines, and rubber stamp dates
  - List view for traditional formatting
  - Compact view for maximum entry density
- 13 color label options:
  - 6 bright colors (red, orange, yellow, green, blue, purple)
  - 6 soft/heather colors (soft pink, peach, mint, lavender, gray, teal)
  - No-color option (black was removed due to text visibility issues)
- **Trash/Recycle Bin System:**
  - Deleted entries instantly move to trash (no confirmation)
  - One-click restore from trash back to active notes
  - Permanent delete requires triple confirmation
  - Nuclear option to clear all data (triple ultra-confirmation)
  - Separate localStorage for trashed entries
  - Trash counter badge in header
  - Visual feedback with dashed borders on trashed entries
- Auto-save functionality:
  - 1-second debounce for text changes
  - Tracks unsaved changes
  - Confirmation before closing with unsaved edits
- Zen mode for distraction-free writing:
  - Dark theme optimized for night writing
  - Full-screen centered editor
  - Minimal UI elements
  - Georgia serif font for comfortable reading
- Search and filter:
  - Real-time search across entry text and locations
  - Case-insensitive matching
- Six sorting modes:
  - Newest first (default)
  - Oldest first
  - Longest entries first
  - Shortest entries first
  - Sort by color
  - Random shuffle
- Data management:
  - Export as formatted TXT file
  - Export as JSON with full data
  - Import JSON with duplicate detection
  - All data stored locally in browser localStorage
- Optional location tracking:
  - Opt-in only (permission requested on toggle)
  - Stores GPS coordinates
  - Preference persists across sessions
- UI enhancements:
  - Collapsible controls for maximum screen space
  - Header view toggle (visible when minimized)
  - Entry counter badge
  - Typewriter-style title with distressed effect
  - Smooth transitions and animations
  - Responsive design for mobile and desktop
- Keyboard shortcuts:
  - `Ctrl/Cmd + Enter` to save entry
  - `Escape` to close modal
  - Native browser undo/redo support
- Modal editing:
  - Click entries in sticky/compact views to edit
  - Full-featured color picker in modal
  - Delete confirmation with entry preview

### Security
- XSS protection via HTML escaping on all user-generated content
- Content Security Policy (CSP) meta tag
- Input validation and sanitization:
  - Color value whitelist validation
  - Maximum entry length (50,000 characters)
  - Import file size limit (10MB)
  - Maximum entries per import (10,000)
  - Location string length limit (200 characters)
- localStorage quota management with error handling
- Secure JSON parsing with validation

### Performance
- Debounced auto-save to prevent excessive writes
- Event delegation for efficient DOM event handling
- Minimal DOM manipulation
- Single initialization of modal event listeners

### Documentation
- Comprehensive README with feature list
- Quick start guide with multiple deployment options
- Troubleshooting section
- Security and privacy information
- MIT License
- Sample entries JSON for testing

## [Unreleased]

### Planned for v2.0
- Tags and categories
- Rich text formatting (bold, italic, links)
- Image attachments
- Cloud sync option (opt-in)
- Dark mode for main interface
- Multiple journals/notebooks
- Export to Markdown
- Calendar view of entries
- Word count and statistics
- Automatic backup reminders
- Entry templates
- Favorites/pinning
- Archive functionality

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
