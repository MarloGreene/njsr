# Random Password Generator (RNG)

Generate cryptographically secure random passwords.

## Features

- **Secure Generation**: Uses Web Crypto API for true randomness
- **Strong Defaults**: 16-character passwords
- **Character Mix**: Uppercase, lowercase, numbers, and symbols
- **One-Click Copy**: Copy password to clipboard instantly
- **Instant Regenerate**: Generate new passwords with one click

## Security

### Character Sets
- **Uppercase**: A-Z (26 characters)
- **Lowercase**: a-z (26 characters)
- **Numbers**: 0-9 (10 characters)
- **Symbols**: !@#$%^&*()-_=+[]{};:,.<>/? (26 characters)

### Guarantees
- At least one character from each category
- Fisher-Yates shuffle for unpredictable order
- Cryptographically secure random number generation

## Usage

1. Open `index.html` in any web browser
2. A secure password is generated immediately
3. Click "Generate New Password" for another
4. Click "Copy Password" to copy to clipboard

## Technical Details

- **Web Crypto API**: `window.crypto.getRandomValues()`
- **No Dependencies**: Pure vanilla JavaScript
- **Self-Contained**: All code in single HTML file
- **Works Offline**: No network required

## Privacy

- **100% Local**: Passwords generated in your browser
- **No Storage**: Nothing saved to localStorage
- **No Transmission**: Passwords never leave your device
- **No Tracking**: Zero analytics

## Customization

To change password length, modify the `desiredLength` variable in the script:
```javascript
const desiredLength = 16; // Change to your preferred length
```

## License

MIT License
