# njsr.org Web Tools

A curated collection of 40+ privacy-first web tools, built with vanilla JavaScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![No Dependencies](https://img.shields.io/badge/dependencies-minimal-brightgreen.svg)]()
[![Vanilla JS](https://img.shields.io/badge/vanilla-JS-yellow.svg)]()

## Overview

**njsr.org** is a portfolio of independent, single-purpose web tools developed from 2002-2026. Each tool is designed to do one thing well, runs entirely in your browser, and respects your privacy.

### Philosophy

- **Privacy First**: All data stays local in your browser. No tracking, no analytics, no accounts.
- **Zero Dependencies**: Most tools are pure HTML/CSS/JavaScript with no build process.
- **Single Purpose**: Each tool solves one problem cleanly.
- **Offline Capable**: Once loaded, most tools work without internet.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/njsr.git
cd njsr

# Option 1: Open directly
open index.html

# Option 2: Run with local server
python -m http.server 8000
# Then visit http://localhost:8000
```

## Tools by Category

### Productivity
| Tool | Description | Path |
|------|-------------|------|
| **just write** | Minimalist journal with 4 view modes and Zen mode | `/write` |
| **Zen Writer** | Distraction-free text editor | `/zenw` |
| **Text Statistics** | Word count and text analysis | `/wc` |
| **Calendar** | Simple yearly calendar display | `/cal` |
| **Countdown Timer** | Event countdown with date/time setting | `/countdown` |
| **Stopwatch** | Polished timing application | `/stopwatch` |
| **Simple Stopwatch** | Basic timing with split functionality | `/split` |
| **Expense Tracker** | Budget management and expense analysis | `/cash` |
| **QR Code Generator** | Custom QR code creation and download | `/qr` |

### Scripture & Religious
| Tool | Description | Path |
|------|-------------|------|
| **Book of Mormon Reader** | Web-based scripture reader | `/bom` |
| **Scripture Highlighter** | LDS scripture reader with highlighting | `/sh` |
| **Scripture Search & Highlighter** | Advanced scripture study tool | `/ssah` |
| **Lightning Fast Scripture Search** | High-performance scripture search | `/lfss` |
| **Scripture Matrix** | Matrix animation with Bible verses | `/sm` |
| **23 Questions** | Book of Mormon educational quiz | `/23` |
| **Ministering Memory Helper** | LDS ministering assignment tracker | `/one` |

### Design & Graphics
| Tool | Description | Path |
|------|-------------|------|
| **Color Picker** | Advanced color selection with screen sampling | `/color` |
| **Color Palette Generator** | Random palette creation with save/lock | `/colors` |
| **Background Gradient Generator** | CSS gradient creator with live preview | `/bg` |

### Security & Passwords
| Tool | Description | Path |
|------|-------------|------|
| **Password Strength Checker** | Password security analyzer | `/pw` |
| **Random Password Generator** | Secure password creation | `/rng` |

### Health & Veterans
| Tool | Description | Path |
|------|-------------|------|
| **PTSD Symptom Awareness** | VA disability rating calculator | `/psa` |
| **Buddy Letter Assistant** | VA PTSD claim support letter generator | `/buddy` |
| **VA Disability Claim Guide** | Veteran benefits resource | `/zonk` |
| **tTracker** | Tinnitus episode logger | `/tt` |

### Networking
| Tool | Description | Path |
|------|-------------|------|
| **IP Information Dashboard** | Network and browser fingerprinting info | `/ip` |
| **Network Information** | IPv4/IPv6 address details | `/ip2` |

### Entertainment
| Tool | Description | Path |
|------|-------------|------|
| **Dice Roller** | Polyhedral dice with drag-and-drop tower | `/dice` |
| **Tarot Card Reader** | Mystical card reading | `/tarot` |
| **Matrix Rain** | Animated falling character effect | `/matrix` |
| **Dynamic Soundboard** | Audio clip player (PHP) | `/sb` |
| **Six Degrees of Kevin Bacon** | Actor connection finder (Node.js) | `/degrees` |

### Music
| Tool | Description | Path |
|------|-------------|------|
| **Metronome** | Interactive metronome with BPM controls | `/click` |

## Technology Stack

### Standard Tools (35+)
- Pure HTML5/CSS3/JavaScript (ES6+)
- localStorage for data persistence
- No build process required
- Zero external dependencies

### Special Tools

**Six Degrees of Kevin Bacon** (`/degrees`)
- Node.js + Express.js backend
- SQLite database with better-sqlite3
- Requires separate setup (see `/degrees/README.md`)

**Dynamic Soundboard** (`/sb`)
- PHP backend
- Requires web server with PHP 7+

## Project Structure

```
njsr/
├── index.html              # Landing page mosaic
├── tools.md                # Auto-generated tool list
├── tools-index.html        # Interactive searchable index
├── update-tools.js         # Documentation generator
├── README.md               # This file
├── LICENSE                 # MIT License
├── SECURITY.md             # Security policy
├── CONTRIBUTING.md         # Contribution guidelines
│
├── [tool-directories]/     # 40+ individual tools
│   ├── index.html
│   ├── script.js (if needed)
│   └── README.md
│
├── stuff/                  # Storage (PDFs, ROMs, text files)
├── textfiles/              # Open-source document repository
└── tools/                  # Dashboard navigation
```

## Running the Documentation Generator

The `update-tools.js` script generates `tools.md` and `tools-index.html`:

```bash
node update-tools.js

# Optional: Create symlinks for tools without index.html
node update-tools.js --create-symlinks
```

## Deployment

### Static Hosting (Most Tools)
Simply upload to any static file host:
- GitHub Pages
- Netlify
- Vercel
- Any web server

### Tools Requiring Backend

**Soundboard (`/sb`)**: Requires PHP-enabled web server

**Six Degrees (`/degrees`)**:
```bash
cd degrees
npm install
node server.js
```

## Security

All tools follow security best practices:
- XSS protection via HTML escaping
- Input validation and sanitization
- No external API calls (except where documented)
- No analytics or tracking
- All data stored locally

See [SECURITY.md](SECURITY.md) for our security policy.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Open an issue on GitHub for bugs or suggestions
- See individual tool READMEs for tool-specific help

---

**njsr.org** - Simple tools that respect your privacy. Since 2002.
