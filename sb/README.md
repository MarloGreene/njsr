# Dynamic Soundboard

A PHP-powered soundboard that automatically loads audio files from a directory.

## Features

- **Auto-Discovery**: Automatically finds all MP3/WAV files in the sounds folder
- **Dynamic Buttons**: Creates a button for each sound file
- **Click to Play**: Single click plays the sound
- **Click Again to Stop**: Clicking while playing stops it
- **One Sound at a Time**: Playing a new sound stops the previous

## Requirements

- Web server with PHP 7.0+
- Apache, Nginx, or similar
- Audio files in `/sounds` directory

## Setup

1. Place audio files in the `sounds/` directory
2. Ensure your web server has PHP enabled
3. Navigate to the tool URL in your browser

## Supported Formats

- `.mp3` - MPEG Audio Layer III
- `.wav` - Waveform Audio File Format

## Adding Sounds

1. Drop `.mp3` or `.wav` files into the `sounds/` folder
2. Refresh the page
3. New buttons appear automatically
4. Button labels are the filename (without extension)

## Naming Convention

File names become button labels:
- `airhorn.mp3` → "airhorn" button
- `sad_trombone.wav` → "sad_trombone" button
- `Applause.mp3` → "Applause" button

## File Structure

```
sb/
├── index.php       # Main soundboard interface
└── sounds/         # Audio files directory
    ├── sound1.mp3
    ├── sound2.wav
    └── ...
```

## Technical Details

- PHP `scandir()` for file discovery
- HTML5 Audio API for playback
- Vanilla JavaScript
- No database required

## Privacy

- No tracking
- No external connections
- Runs on your server
- Audio files served locally

## License

MIT License
