# Security Policy

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in **just write.**, please send an email with details to the maintainer or open a private security advisory on GitHub.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

We will respond within 48 hours and work with you to understand and address the issue.

## Security Measures

This application implements several security measures:

### XSS Protection
- All user input is escaped before rendering as HTML
- Uses `textContent` for safe text insertion
- HTML escaping function for all dynamic content
- Content Security Policy (CSP) headers
- No `eval()` or `innerHTML` with unsanitized data

### Input Validation
- Color values validated against whitelist
- Text length limits enforced (50,000 chars max)
- Location data length limited (200 chars)
- File size limits on imports (10MB max)
- Entry count limits (10,000 per import)

### Data Sanitization
- All imported JSON data sanitized
- Type checking on all fields
- Invalid data rejected or cleaned
- Prototype pollution prevention

### Storage Security
- localStorage quota management
- Size checks before saving
- Error handling for storage failures
- Data stays local (never transmitted)

### Privacy Protection
- No external API calls
- No tracking or analytics
- No cookies (only localStorage)
- Location tracking opt-in only
- All data remains on user's device

## Known Limitations

### Browser Storage
- localStorage is not encrypted by browser
- Clearing browser data will delete entries
- Shared computer access could expose data
- Consider using private/incognito mode for sensitive content

### Client-Side Security
- As a client-side app, it inherits browser security context
- XSS protection relies on browser capabilities
- No server-side validation or authentication

## Best Practices for Users

1. **Regular Backups**: Export your data regularly as JSON
2. **Private Browsing**: Use for sensitive entries
3. **Browser Security**: Keep your browser updated
4. **Physical Security**: Lock your device when not in use
5. **Extension Awareness**: Browser extensions can access localStorage

## Disclosure Policy

- Security issues will be addressed in priority patches
- Critical vulnerabilities fixed within 72 hours
- Security updates documented in CHANGELOG
- Users notified through GitHub releases

## Security Updates

### v1.0.0 (January 2026)
- Initial security implementation
- XSS protection on all user input
- Input validation and sanitization
- Storage quota management
- CSP headers added
- No external dependencies or calls

---

**Last Updated**: January 12, 2026
