# tTracker — simple local tinnitus logger

Press the left or right arrow keys when tinnitus starts; press the same key again when it stops. Everything is stored locally in your browser's `localStorage`. No account required.

Files:

- [index.html](index.html) — main UI
- [styles.css](styles.css) — styles
- [app.js](app.js) — JavaScript logic

Usage:

Open `index.html` in your browser. On macOS you can:

```bash
open index.html
```

Or run a temporary static server (recommended for some browsers):

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Features:

- Two big buttons and arrow-key support for Left/Right
- Instant logging of start/stop with timestamps and duration
- Edit notes for events later
- Export all events to CSV
- Clear all data

Privacy: all data is stored in-browser only (localStorage). Deleting browser storage or using the Clear All button removes data.
