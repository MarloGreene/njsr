# Zen Writer v1

A zero-distraction, full-screen writing app that keeps all data in your browser.

## Features

- Full-screen text editor
- Pseudo file system: create, save, and switch between multiple text files
- Auto-save to localStorage
- Export current file to a text file
- Import text files as new files
- Dark mode (default) and light mode toggle
- Font family selection
- Font size adjustment

## Usage

1. Open `index.html` in your web browser.
2. Start writing immediately in the text area.
3. Your work is automatically saved in your browser's localStorage.
4. Use the toolbar at the bottom to:
   - Select or switch between files using the dropdown
   - Create a new file with "New"
   - Save the current content as a new file with "Save As"
   - Toggle between light and dark themes
   - Change font family
   - Adjust font size
   - Export the current file
   - Import a text file as a new file

## Tech Stack

- HTML
- CSS
- JavaScript
- localStorage for data persistence

## Running Locally

To run the app locally with a server (recommended for proper functionality):

```bash
cd /path/to/zenw
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Troubleshooting

- If auto-save isn't working, check that your browser allows localStorage.
- For import/export, ensure your browser supports the File API.
- The app works offline once loaded.