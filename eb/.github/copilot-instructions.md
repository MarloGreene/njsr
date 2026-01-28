# Copilot Instructions for eb Project

## Project Overview
This is a web-based ebook reader for LDS Standard Works scriptures (Book of Mormon, Doctrine and Covenants, King James Version Bible, Pearl of Great Price). Built with plain HTML, CSS, and JavaScript, using localStorage for persistence. The app loads plain text files (one verse per line, tab-delimited), parses them into structured data, and provides reading, searching, and highlighting features.

## Architecture
- **Major Components**: 
  - `index.html`: Single-page layout with header controls, content display.
  - `style.css`: Responsive styling with light/dark themes, column layouts.
  - `script.js`: Core logic for loading/parsing scriptures, search, highlighting, localStorage management.
  - Book files: `bom.txt`, `dnc.txt`, `kjv.txt`, `pogp.txt` (plain text, tab-separated).
- **Service Boundaries**: Client-side only; no server/backend.
- **Data Flows**: 
  - Load: Fetch TXT files → Parse into `scriptures` object {book: {chapter: {verse: {text, ref}}}}.
  - Display: Render current chapter or search results as verse divs.
  - Highlight: Store in `highlights` object {book: {chapter: {verse: [{type, color, text, timestamp, notes}]}}}; apply via CSS classes/styles.
  - Persist: Use localStorage for highlights, current state (book/chapter/search), UI settings.
- **Structural Decisions**: Single-page app for simplicity; verses as selectable divs; highlights as background colors or borders; realtime search via input event.

## Developer Workflows
- **Installation**: No dependencies; open `index.html` in browser or serve locally (e.g., `python3 -m http.server 8080`).
- **Running the App**: Open `index.html` in a modern browser. For local serving, run `python3 -m http.server 8080` in project directory.
- **Building**: No build process; static files.
- **Testing**: Manual testing in browser; check console for errors. Test highlights persistence, search, import/export.
- **Debugging**: Use browser dev tools; console.log for parsing/search logic. Ensure TXT files load correctly (check network tab).

## Conventions and Patterns
- **Code Style**: ES6+ JavaScript; async/await for fetches; event listeners for UI; camelCase variables.
- **Async Handling**: `async/await` for loading book files.
- **Error Handling**: Basic try/catch in JSON import; alert for invalid files.
- **File Structure**: Flat structure; scripts/styles in root.
- **Imports**: No modules; global functions.
- **Data Parsing**: Split TXT by `\n`, then `\t`; regex for verse refs (e.g., `Book Chapter:Verse`).
- **UI Events**: Double-click for verse highlight; mouseup for phrase/box selection (expand to whole words).
- **Highlighting**: Verse: whole div background; Phrase: background; Box: border. Store selections in highlights array per verse.
- **Search**: Realtime via `input` event; case-insensitive; filter verses containing query; toggle for all books vs. current.
- **Persistence**: localStorage for all state; JSON import/export for highlights.

## Integration Points
- **External Dependencies**: None; pure web app.
- **APIs**: None.
- **Databases**: localStorage as key-value store.
- **Cross-Component Communication**: Direct DOM manipulation; global variables for state.

## Key Files/Directories
- `index.html`: Main page with dropdowns, controls, palette, content area.
- `style.css`: Themes, responsive columns, highlight styles.
- `script.js`: Load/parse books, handle UI, search, highlights, localStorage.
- `*.txt`: Scripture files; format: "Book Chapter:Verse<TAB>Text" per line.

These instructions reflect the implemented features. Update as new functionality (e.g., notes editing) is added.</content>
<parameter name="filePath">/Users/ian/MEGA/code/webs/njsr/eb/.github/copilot-instructions.md