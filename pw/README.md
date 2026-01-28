# Password Strength Checker

Analyze password security and get estimates for crack time.

## Features

- **Strength Analysis**: Real-time password strength evaluation
- **Crack Time Estimate**: How long it would take to crack
- **Generate Strong Password**: Create secure random passwords
- **Visual Feedback**: Clear strength indicators

## Usage

1. Open `index.html` in any web browser
2. Type or paste a password
3. See strength rating and crack time estimate
4. Click "Generate Strong Password" for a secure option

## Strength Factors

The checker evaluates:
- Password length
- Uppercase letters
- Lowercase letters
- Numbers
- Special characters
- Common patterns to avoid

## Files

- `index.html` - Main interface
- `style.css` - Styling
- `script.js` - Analysis logic

## Security Note

- Passwords are analyzed **locally only**
- Nothing is sent to any server
- Your passwords never leave your browser

## Technical Details

- Entropy-based calculations
- Pattern detection
- Vanilla JavaScript
- No dependencies

## Privacy

- **100% Local**: All analysis in browser
- **No Transmission**: Passwords stay on your device
- **No Storage**: Nothing saved to localStorage

## License

MIT License
