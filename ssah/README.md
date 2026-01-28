# LDS Scripture Search & Highlighter (SSAH)

An advanced scripture study tool combining powerful search with highlighting and annotation features.

## Features

### Search
- **Full-Text Search**: Search across all LDS standard works
- **Instant Results**: Results appear as you type
- **Context Display**: See verses with surrounding text

### Highlighting
- **Multi-Color Highlighting**: Choose from multiple highlight colors
- **Persistent Storage**: Highlights saved to localStorage
- **Visual Markers**: Clear indication of highlighted passages

### Scripture Coverage
- Holy Bible (King James Version)
- Book of Mormon
- Doctrine and Covenants
- Pearl of Great Price

## Usage

1. Open `index.html` in any web browser
2. Search for scriptures using the search bar
3. Click verses to highlight them
4. Choose highlight colors for organization
5. Return to see your saved highlights

## Files

- `index.html` - Main interface
- `styles.css` - Styling
- `script.js` - Search and highlight logic
- `quad.txt` - Scripture text data
- `quad-normalized.txt` - Normalized scripture data

## Data Files

The tool uses pre-processed scripture data (~21MB total) for efficient searching and display.

## Related Tools

- `/sh` - Scripture Highlighter (simpler highlighting)
- `/lfss` - Lightning Fast Scripture Search (search-focused)
- `/ss` - Scripture Search (basic search)
- `/bom` - Book of Mormon Reader (reading-focused)

## Technical Details

- Client-side search and highlighting
- localStorage for persistent highlights
- Vanilla JavaScript
- No external dependencies

## Privacy

- All data stored locally in browser
- No external connections
- No tracking or analytics
- Works offline after initial load

## License

MIT License

## Scripture Copyright

Scripture texts from The Church of Jesus Christ of Latter-day Saints.
