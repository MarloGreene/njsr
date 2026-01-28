# Stopwatch

A polished stopwatch application with split time tracking.

## Features

- **Precise Timing**: Centisecond (1/100 second) accuracy
- **Split Times**: Record lap times while timer runs
- **Visual Design**: Clean, modern interface
- **Split List**: Scrollable history of recorded splits
- **Start/Stop/Reset**: Standard stopwatch controls

## Display Format

```
HH:MM:SS.cc
```
- HH: Hours (00-99)
- MM: Minutes (00-59)
- SS: Seconds (00-59)
- cc: Centiseconds (00-99)

## Controls

| Button | Action |
|--------|--------|
| Start | Begin timing |
| Stop | Pause timing |
| Split | Record current time |
| Reset | Clear timer and splits |

## Usage

1. Open `index.html` in any web browser
2. Click "Start" to begin timing
3. Click "Split" to record lap times
4. Click "Stop" to pause
5. Click "Reset" to clear everything

## Files

- `index.html` - Main structure
- `stopwatch.css` - Styling
- `stopwatch.js` - Timer logic

## Technical Details

- `setInterval` for timing updates
- Centisecond precision
- Vanilla JavaScript
- No dependencies

## Privacy

- No data storage
- No localStorage usage
- No external connections

## License

MIT License
