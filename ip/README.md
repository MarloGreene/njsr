# IP Information Dashboard

A simple, vanilla HTML/JS/CSS tool to display your IP addresses (IPv4 and IPv6), geolocation information, and comprehensive browser fingerprinting data.

## Features

- **IP Information**: Displays your public IPv4 and IPv6 addresses with click-to-copy functionality.
- **Geolocation**: Shows approximate location based on IP (country, region, city, ISP, timezone).
- **Browser Fingerprinting**: Collects and displays over 20 data points about your browser and device, including user agent, screen properties, plugins, WebGL info, canvas fingerprint, and more.
- **Obfuscation Tips**: Provides basic advice on how to make your fingerprint less unique.
- **Refresh Functionality**: Button to reload all data with visual feedback.
- **Privacy Focused**: All data is processed client-side; nothing is sent to external servers except API fetches.

## Usage

1. Open `index.html` in a modern web browser.
2. The page will automatically load your IP and fingerprinting data.
3. Click on IP addresses to copy them to clipboard.
4. Use the "Refresh Data" button to update information.
5. View the fingerprinting table and obfuscation tips for privacy awareness.

## Hosting

Host on HTTPS for security. The page uses Content Security Policy to restrict external resources.

## APIs Used

- [ipify.org](https://ipify.org/) for IP addresses
- [ipapi.co](https://ipapi.co/) for geolocation

No API keys required.

## License

This project is licensed under the MIT License. See the footer in the app for details.

## Security

- No data is transmitted from your browser except to the listed APIs.
- All fingerprinting data remains local.
- Includes CSP for additional security.
- Privacy warning included in the app.

## Browser Support

Modern browsers with ES6+ support. May not work in very old browsers due to async/await and fetch API.

## Contributing

Feel free to fork and improve. This is a simple tool for educational purposes.