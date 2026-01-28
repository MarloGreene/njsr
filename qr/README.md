# QR Code Generator

Generate customizable QR codes for URLs, text, and more.

## Features

### QR Code Options
- **Any Content**: URLs, text, contact info, WiFi credentials
- **Custom Colors**: Choose QR code foreground color
- **Size Control**: 128px to 512px
- **Error Correction**: Low, Medium, Quartile, High levels

### Output
- **Live Preview**: See QR code as you type
- **PNG Download**: Save to your device
- **History**: Recently generated codes saved

### Error Correction Levels
- **Low (L)**: ~7% recovery, smallest code
- **Medium (M)**: ~15% recovery, balanced
- **Quartile (Q)**: ~25% recovery
- **High (H)**: ~30% recovery, most robust

## Usage

1. Open `index.html` in any web browser
2. Enter URL or text content
3. Customize color and size
4. Adjust error correction level
5. Click "Download PNG" to save

## Files

- `index.html` - Main interface
- `qr.css` - Styling
- `qr.js` - QR generation handling

## Dependencies

- qrcode.js (CDN) - QR code generation library

## History Feature

- Recently generated QR codes saved locally
- Click any historical QR to regenerate
- Clear all history option available

## Privacy

- History stored in localStorage
- No external tracking
- QR generation uses CDN library

## Technical Details

- Uses qrcodejs library
- Canvas-based rendering
- PNG export capability
- Responsive design

## License

MIT License
