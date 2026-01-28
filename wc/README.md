# Text Statistics (Word Count)

A comprehensive text analysis tool with real-time statistics.

## Features

### Statistics Provided
| Metric | Description |
|--------|-------------|
| Characters | Total character count |
| Characters (no spaces) | Characters excluding whitespace |
| Words | Total word count |
| Sentences | Sentence count (by punctuation) |
| Paragraphs | Paragraph count (by blank lines) |
| Lines | Total line count |
| Reading Time | Estimated minutes to read (~200 WPM) |
| Speaking Time | Estimated minutes to speak (~150 WPM) |

### Additional Features
- **Real-time Updates**: Stats update as you type
- **Auto-save**: Text persists in localStorage
- **Copy Stats**: One-click copy all statistics
- **Clear Text**: Reset the input area
- **Clear Saved**: Remove stored text from localStorage

## Usage

1. Open `index.html` in any web browser
2. Type or paste text into the input area
3. View real-time statistics below
4. Click "Copy Stats" to copy statistics summary
5. Click "Clear Text" to reset

## Files

- `index.html` - Main interface
- `textstats.css` - Styling
- `textstats.js` - Analysis logic

## Reading/Speaking Time Calculation

- **Reading**: ~200 words per minute (average adult)
- **Speaking**: ~150 words per minute (presentation pace)

## Technical Details

- Real-time RegExp-based analysis
- localStorage for text persistence
- Debounced updates for performance
- Vanilla JavaScript
- No dependencies

## Privacy

- Text saved in localStorage only
- No external connections
- No tracking

## License

MIT License
