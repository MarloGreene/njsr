# Codex

A unified text explorer for searching, analyzing, and exploring classical texts.

## Features

- **Multi-file search** - Select multiple texts and search across them simultaneously
- **Collapsible groups** - Shakespeare's 42 works grouped in an expandable folder
- **Drag-and-drop** - Add your own .txt or .md files (stored in localStorage)
- **Statistics panel** - Word cloud, frequency analysis, random verse generator
- **Full text reader** - Jump from search results to full context
- **Three themes** - Light, dark, and sepia
- **Keyboard shortcuts** - Press `?` for the full list

## Included Texts

**Shakespeare (42 works)** - From the Folger Shakespeare Library
- All plays, sonnets, and poems
- Clean, modern-edited text

**Scripture (4 volumes)**
- Bible (KJV)
- Book of Mormon
- Doctrine & Covenants
- Pearl of Great Price

## Setup

1. Place source texts in `txt/` subdirectories
2. Run the preprocessor to build the search index:
   ```bash
   node preprocess.js
   ```
3. Open `index.html` in a browser

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `Esc` | Clear search / close modal |
| `t` | Toggle theme |
| `s` | Toggle stats panel |
| `r` | Random verse |
| `←` `→` | Previous / next page |
| `1-9` | Toggle file selection |
| `?` | Show help |

## Privacy

All data stays local:
- Search index generated from local files
- User-uploaded files stored in localStorage
- No server-side processing or tracking
