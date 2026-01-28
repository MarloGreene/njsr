# Security Policy

## Our Commitment

The njsr.org web tools are built with privacy and security as core principles. All tools are designed to:

- Keep your data local (browser localStorage only)
- Never transmit data to external servers (unless explicitly documented)
- Never track users or collect analytics
- Minimize attack surface by avoiding dependencies

## Security Measures

### Input Handling
- All user input is sanitized before display
- HTML escaping prevents XSS attacks
- Input length limits prevent DoS via oversized data
- File imports have size limits (typically 10MB max)

### Data Storage
- All data stored in browser localStorage
- No cookies used for tracking
- No session tokens or authentication (no accounts)
- No server-side data storage (for static tools)

### Content Security
- No inline event handlers in HTML
- No `eval()` or dynamic code execution
- Color and value inputs use whitelist validation
- External resources avoided where possible

## Tools with External Dependencies

The following tools have special security considerations:

### Six Degrees of Kevin Bacon (`/degrees`)
- **Backend**: Node.js + Express.js server
- **Database**: SQLite (local, read-only operations)
- **External API**: TMDB API (for data fetching only)
- **Risk**: Runs server-side; standard web server security applies
- **Mitigation**: No user data stored; database is read-only

### Dynamic Soundboard (`/sb`)
- **Backend**: PHP
- **Risk**: Server-side PHP execution
- **Mitigation**: Only reads from local sounds directory; no user uploads

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **Do not open a public issue**
2. Email the maintainer directly (if available) or open a private security advisory
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix/Mitigation**: Depends on severity
  - Critical: Within 24-48 hours
  - High: Within 1 week
  - Medium/Low: Next release cycle

## Security Best Practices for Users

### General Usage
- Use a modern, updated browser
- Clear localStorage periodically if desired
- Export important data regularly (JSON backups)
- Don't use tools on shared/public computers for sensitive data

### For Tools with Backends
- Run Node.js and PHP tools behind a reverse proxy in production
- Keep dependencies updated (`npm audit`, `npm update`)
- Use HTTPS in production environments

## Scope

This security policy covers:
- All client-side JavaScript tools
- The Node.js backend for Six Degrees
- The PHP backend for Soundboard

Out of scope:
- Third-party dependencies (report to upstream)
- Browser vulnerabilities (report to browser vendor)
- Server configuration issues (depends on your setup)

## Security Checklist for Contributors

When adding or modifying tools:

- [ ] Sanitize all user input before display
- [ ] Use `textContent` instead of `innerHTML` when possible
- [ ] Validate file imports (size, format)
- [ ] Avoid external API calls unless necessary
- [ ] No tracking, analytics, or telemetry
- [ ] Document any external dependencies
- [ ] Test with browser developer tools for console errors/warnings

## Acknowledgments

We appreciate responsible disclosure from the security community. Contributors who report valid security issues will be acknowledged (with permission) in release notes.

---

Last updated: January 2026
