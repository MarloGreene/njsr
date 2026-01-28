# Color Picker

An advanced color selection tool with multiple input formats and screen sampling.

## Features

### Color Selection
- **Visual Picker**: Saturation/brightness canvas for intuitive selection
- **Hue Slider**: Full spectrum hue control
- **Opacity Slider**: Alpha channel support
- **Eye Dropper**: Pick colors directly from your screen (supported browsers)

### Color Formats
- **HEX**: Standard web hex codes (#RRGGBB)
- **RGB**: Red, Green, Blue values (0-255)
- **HSL**: Hue, Saturation, Lightness values

### Additional Features
- **Color History**: Automatically saves recently picked colors
- **Copy to Clipboard**: One-click copy for any format
- **Live Preview**: See your selected color in real-time
- **Clear History**: Reset saved colors

## Usage

1. Open `index.html` in any web browser
2. Use the canvas to pick saturation/brightness
3. Adjust hue with the spectrum slider
4. Set opacity if needed
5. Copy the HEX, RGB, or HSL values
6. Use Eye Dropper to sample from screen (Chrome/Edge)

## Files

- `index.html` - Main structure
- `color-picker.css` - Styling
- `color-picker.js` - Color manipulation logic

## Eye Dropper Support

The screen sampling feature uses the EyeDropper API, available in:
- Chrome 95+
- Edge 95+
- Opera 81+

Not yet supported in Firefox or Safari.

## Privacy

- Color history stored in localStorage
- No external connections
- No tracking

## Technical Details

- Canvas API for color picker
- EyeDropper API for screen sampling
- Vanilla JavaScript
- No dependencies

## License

MIT License
