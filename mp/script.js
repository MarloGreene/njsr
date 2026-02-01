// Markdown Preview - Minimalist two-pane editor

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const fileSelect = document.getElementById('file-select');
const newFileBtn = document.getElementById('new-file');
const deleteFileBtn = document.getElementById('delete-file');
const themeToggle = document.getElementById('theme-toggle');
const exportMdBtn = document.getElementById('export-md');
const exportHtmlBtn = document.getElementById('export-html');
const saveCheatsheetBtn = document.getElementById('save-cheatsheet');

// ============================================
// MARKDOWN PARSER
// ============================================

function parseMarkdown(md) {
    if (!md) return '';

    let html = md;

    // Escape HTML to prevent XSS
    html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // URL sanitizer for attributes (prevents XSS via attribute injection)
    function sanitizeUrl(url) {
        // Decode HTML entities that may have been escaped
        const decoded = url
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

        // Block javascript: and data: URLs
        if (/^\s*(javascript|data|vbscript):/i.test(decoded)) {
            return '#blocked';
        }

        // Escape quotes and special chars for safe attribute insertion
        return decoded
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Escape text for safe insertion into attributes
    function sanitizeAttr(text) {
        return text
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Store code blocks temporarily to prevent parsing inside them
    const codeBlocks = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const index = codeBlocks.length;
        codeBlocks.push(`<pre><code class="language-${lang}">${code.trim()}</code></pre>`);
        return `%%CODEBLOCK${index}%%`;
    });

    // Inline code (must be before other inline processing)
    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
        const index = inlineCodes.length;
        inlineCodes.push(`<code>${code}</code>`);
        return `%%INLINECODE${index}%%`;
    });

    // Headers
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Horizontal rules
    html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr>');

    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    // Merge consecutive blockquotes
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

    // Unordered lists
    html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<oli>$1</oli>');
    html = html.replace(/(<oli>.*<\/oli>\n?)+/g, (match) => {
        return '<ol>' + match.replace(/<\/?oli>/g, (tag) => tag.replace('oli', 'li')) + '</ol>';
    });

    // Tables
    html = html.replace(/^\|(.+)\|\s*\n\|[\s\-:|]+\|\s*\n((?:\|.+\|\s*\n?)+)/gm, (match, header, body) => {
        const headers = header.split('|').map(h => h.trim()).filter(Boolean);
        const rows = body.trim().split('\n').map(row =>
            row.split('|').map(c => c.trim()).filter(Boolean)
        );

        let table = '<table><thead><tr>';
        headers.forEach(h => table += `<th>${h}</th>`);
        table += '</tr></thead><tbody>';
        rows.forEach(row => {
            table += '<tr>';
            row.forEach(cell => table += `<td>${cell}</td>`);
            table += '</tr>';
        });
        table += '</tbody></table>';
        return table;
    });

    // Images (before links to prevent collision)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
        return `<img src="${sanitizeUrl(url)}" alt="${sanitizeAttr(alt)}">`;
    });

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        return `<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    // Bold (must be before italic)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Paragraphs - wrap remaining text blocks
    html = html.split('\n\n').map(block => {
        block = block.trim();
        if (!block) return '';
        // Don't wrap if it's already an HTML element
        if (/^<(h[1-6]|p|ul|ol|li|blockquote|pre|hr|table|img|div)/.test(block)) {
            return block;
        }
        // Don't wrap placeholders
        if (/^%%/.test(block)) {
            return block;
        }
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    // Restore code blocks
    codeBlocks.forEach((code, i) => {
        html = html.replace(`%%CODEBLOCK${i}%%`, code);
    });

    // Restore inline code
    inlineCodes.forEach((code, i) => {
        html = html.replace(`%%INLINECODE${i}%%`, code);
    });

    return html;
}

function updatePreview() {
    preview.innerHTML = parseMarkdown(editor.value);
}

// ============================================
// FILE MANAGEMENT
// ============================================

const files = {
    data: {},
    current: 'untitled.md'
};

function loadFiles() {
    try {
        const saved = localStorage.getItem('mp-files');
        files.data = saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Failed to parse files:', e);
        files.data = {};
    }

    files.current = localStorage.getItem('mp-current') || 'untitled.md';

    if (!files.data[files.current]) {
        files.data[files.current] = getDefaultContent();
    }
}

function getDefaultContent() {
    return `# Welcome to Markdown Preview

A minimalist two-pane editor.

## Features

- **Real-time preview** as you type
- Headers, **bold**, *italic*, ~~strikethrough~~
- [Links](https://example.com) and images
- Lists and blockquotes
- Code blocks with syntax highlighting
- Tables

## Example Code

\`\`\`javascript
function hello() {
    console.log('Hello, world!');
}
\`\`\`

## Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

## Table

| Feature | Status |
|---------|--------|
| Headers | ✓ |
| Lists | ✓ |
| Code | ✓ |

---

Start writing!`;
}

function saveFiles() {
    localStorage.setItem('mp-files', JSON.stringify(files.data));
    localStorage.setItem('mp-current', files.current);
}

function updateFileSelect() {
    fileSelect.innerHTML = '';
    Object.keys(files.data).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        if (name === files.current) option.selected = true;
        fileSelect.appendChild(option);
    });
}

function switchFile(name) {
    files.data[files.current] = editor.value;
    files.current = name;
    editor.value = files.data[name] || '';
    saveFiles();
    updateFileSelect();
    updatePreview();
}

function createFile() {
    const name = prompt('New file name:');
    if (!name || !name.trim()) return;

    let cleanName = name.trim().replace(/[<>:"/\\|?*]/g, '');
    if (!cleanName.endsWith('.md')) cleanName += '.md';

    if (files.data[cleanName]) {
        alert('File already exists');
        return;
    }

    files.data[files.current] = editor.value;
    files.data[cleanName] = '';
    files.current = cleanName;
    editor.value = '';

    saveFiles();
    updateFileSelect();
    updatePreview();
    editor.focus();
}

function deleteFile() {
    const fileNames = Object.keys(files.data);
    if (fileNames.length <= 1) {
        alert('Cannot delete the last file');
        return;
    }

    if (!confirm(`Delete "${files.current}"?`)) return;

    delete files.data[files.current];
    files.current = Object.keys(files.data).sort()[0];
    editor.value = files.data[files.current] || '';

    saveFiles();
    updateFileSelect();
    updatePreview();
}

// ============================================
// CHEAT SHEET
// ============================================

const CHEATSHEET_CONTENT = `# Markdown Cheat Sheet

Quick reference for markdown syntax.

---

## Text Formatting

| Syntax | Result |
|--------|--------|
| \`**bold**\` | **bold** |
| \`*italic*\` | *italic* |
| \`~~strike~~\` | ~~strike~~ |
| \`\\\`code\\\`\` | \`code\` |

---

## Headers

\`\`\`
# H1
## H2
### H3
#### H4
\`\`\`

---

## Links & Images

**Link:** \`[text](https://url.com)\`

[Example link](https://example.com)

**Image:** \`![alt](https://url.com/img.jpg)\`

---

## Lists

**Unordered:**
\`\`\`
- Item one
- Item two
- Item three
\`\`\`

- Item one
- Item two
- Item three

**Ordered:**
\`\`\`
1. First
2. Second
3. Third
\`\`\`

1. First
2. Second
3. Third

---

## Blockquotes

\`\`\`
> This is a quote
\`\`\`

> This is a quote

---

## Code Blocks

\`\`\`
\\\`\\\`\\\`javascript
const x = 42;
\\\`\\\`\\\`
\`\`\`

\`\`\`javascript
const x = 42;
\`\`\`

---

## Tables

\`\`\`
| Header | Header |
|--------|--------|
| Cell   | Cell   |
| Cell   | Cell   |
\`\`\`

| Header | Header |
|--------|--------|
| Cell   | Cell   |
| Cell   | Cell   |

---

## Horizontal Rule

\`\`\`
---
\`\`\`

---

*That's it! Keep this file for reference.*
`;

function saveCheatsheet() {
    const filename = 'markdown-cheatsheet.md';

    // Save current file first
    files.data[files.current] = editor.value;

    // Check if cheatsheet already exists
    if (files.data[filename]) {
        if (!confirm('Cheat sheet already exists. Replace it?')) {
            // Just switch to it
            switchFile(filename);
            pulseFileSelect();
            return;
        }
    }

    // Create/update the cheatsheet
    files.data[filename] = CHEATSHEET_CONTENT;
    files.current = filename;
    editor.value = CHEATSHEET_CONTENT;

    saveFiles();
    updateFileSelect();
    updatePreview();

    // Pulse animation on file select
    pulseFileSelect();
}

function pulseFileSelect() {
    fileSelect.classList.add('pulse');
    setTimeout(() => {
        fileSelect.classList.remove('pulse');
    }, 2000);
}

// ============================================
// EXPORT
// ============================================

function exportFile(type) {
    const filename = files.current.replace(/\.md$/, '');
    let content, mime, ext;

    if (type === 'md') {
        content = editor.value;
        mime = 'text/markdown';
        ext = 'md';
    } else {
        content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
        pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
        code { font-family: monospace; background: #f1f3f5; padding: 0.2em 0.4em; border-radius: 3px; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; color: #666; }
        img { max-width: 100%; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background: #f6f8fa; }
    </style>
</head>
<body>
${parseMarkdown(editor.value)}
</body>
</html>`;
        mime = 'text/html';
        ext = 'html';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// THEME
// ============================================

let theme = localStorage.getItem('mp-theme') || 'dark';

function applyTheme() {
    document.body.classList.toggle('light', theme === 'light');
    themeToggle.textContent = theme;
}

function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mp-theme', theme);
    applyTheme();
}

// ============================================
// EVENT LISTENERS
// ============================================

editor.addEventListener('input', () => {
    files.data[files.current] = editor.value;
    saveFiles();
    updatePreview();
});

fileSelect.addEventListener('change', () => switchFile(fileSelect.value));
newFileBtn.addEventListener('click', createFile);
deleteFileBtn.addEventListener('click', deleteFile);
themeToggle.addEventListener('click', toggleTheme);
exportMdBtn.addEventListener('click', () => exportFile('md'));
exportHtmlBtn.addEventListener('click', () => exportFile('html'));
saveCheatsheetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveCheatsheet();
});

// Sync scroll (optional - preview follows editor)
editor.addEventListener('scroll', () => {
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    const previewPane = document.getElementById('preview-pane');
    previewPane.scrollTop = ratio * (previewPane.scrollHeight - previewPane.clientHeight);
});

// ============================================
// INITIALIZATION
// ============================================

loadFiles();
updateFileSelect();
editor.value = files.data[files.current] || '';
applyTheme();
updatePreview();
