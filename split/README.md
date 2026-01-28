# Simple Stopwatch

A minimal stopwatch with split time functionality and keyboard shortcuts.

## Features

- **Precise Timing**: Millisecond accuracy
- **Split Times**: Record lap/split times while running
- **Keyboard Shortcuts**: Full keyboard control
- **Minimal Interface**: Clean, distraction-free design

## Controls

### Buttons
- **Start/Stop**: Toggle timer running
- **Split**: Record current time (while running)
- **Reset**: Clear timer and all splits

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `S` | Start/Stop |
| `Space` | Split |
| `R` | Reset |

## Display Format

```
MM:SS.mmm
```
- MM: Minutes (00-99)
- SS: Seconds (00-59)
- mmm: Milliseconds (000-999)

## Usage

1. Open `index.html` in any web browser
2. Press `S` or click "Start" to begin timing
3. Press `Space` or click "Split" to record splits
4. Press `S` again to stop
5. Press `R` to reset

## Technical Details

- `Date.now()` for timing
- 10ms update interval
- Vanilla JavaScript
- Self-contained single HTML file
- No dependencies

## Privacy

- No data storage
- No localStorage usage
- No external connections

## License

MIT License
